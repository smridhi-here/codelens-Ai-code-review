"""
Codelens AI engine (Python / FastAPI).

Spring Boot sends {language, code} to POST /analyze and gets back
{score, summary, issues[]}. Python code is analysed with the real `ast`
module (it parses the code into a syntax tree). JavaScript is analysed
with pattern rules.
"""
import ast
import json
import os
import re
import secrets
import shutil
import subprocess
import tempfile
import urllib.error
import urllib.request
from typing import List, Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Codelens AI Engine")

def _load_env_file():
    """Read ai-engine/.env (KEY=value lines) so the API key never goes in code."""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_env_file()


def require_engine_key(x_engine_key: Optional[str] = Header(default=None)):
    """If ENGINE_API_KEY is set, only callers that send it may use the engine."""
    expected = os.environ.get("ENGINE_API_KEY", "").strip()
    if expected and not secrets.compare_digest(x_engine_key or "", expected):
        raise HTTPException(status_code=401, detail="Invalid engine key")



class AnalyzeRequest(BaseModel):
    language: str
    code: str


class Issue(BaseModel):
    severity: str          # error | warning | info
    rule: str
    line: Optional[int] = None
    message: str
    suggestion: Optional[str] = None


class AnalyzeResponse(BaseModel):
    score: int
    summary: str
    issues: List[Issue]


def issue(severity, rule, line, message, suggestion):
    return Issue(severity=severity, rule=rule, line=line,
                 message=message, suggestion=suggestion)


# ---------------------------------------------------------------- Python ---
def analyze_python(code: str) -> List[Issue]:
    issues: List[Issue] = []
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return [issue("error", "syntax-error", e.lineno,
                      f"Syntax error: {e.msg}", "Fix the syntax before review.")]

    imported = {}
    used = set()

    for node in ast.walk(tree):
        if isinstance(node, ast.ExceptHandler) and node.type is None:
            issues.append(issue("error", "bare-except", node.lineno,
                "Bare 'except:' catches every exception, even KeyboardInterrupt.",
                "Catch a specific exception, e.g. 'except ValueError:'."))
        if isinstance(node, ast.ExceptHandler) and len(node.body) == 1 \
                and isinstance(node.body[0], ast.Pass):
            issues.append(issue("error", "empty-except", node.lineno,
                "Exception is caught and silently ignored.",
                "Log the error or handle it explicitly."))
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            for d in node.args.defaults + node.args.kw_defaults:
                if isinstance(d, (ast.List, ast.Dict, ast.Set)):
                    issues.append(issue("error", "mutable-default", node.lineno,
                        f"Function '{node.name}' uses a mutable default argument.",
                        "Use None as the default and create the object inside."))
            if not ast.get_docstring(node):
                issues.append(issue("info", "missing-docstring", node.lineno,
                    f"Function '{node.name}' has no docstring.",
                    "Add a one-line docstring describing what it does."))
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) \
                and node.func.id in ("eval", "exec"):
            issues.append(issue("error", "dangerous-call", node.lineno,
                f"'{node.func.id}()' can execute arbitrary code.",
                "Avoid it; use ast.literal_eval or a safer design."))
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) \
                and node.func.id == "print":
            issues.append(issue("info", "no-print", node.lineno,
                "Leftover print() statement.",
                "Use the logging module instead."))
        if isinstance(node, ast.Import):
            for a in node.names:
                imported[(a.asname or a.name).split(".")[0]] = node.lineno
        if isinstance(node, ast.ImportFrom):
            for a in node.names:
                imported[a.asname or a.name] = node.lineno
        if isinstance(node, ast.Name):
            used.add(node.id)
        if isinstance(node, ast.Attribute):
            base = node
            while isinstance(base, ast.Attribute):
                base = base.value
            if isinstance(base, ast.Name):
                used.add(base.id)

    for name, lineno in imported.items():
        if name not in used:
            issues.append(issue("warning", "unused-import", lineno,
                f"'{name}' is imported but never used.", "Remove the import."))

    for i, line in enumerate(code.splitlines(), 1):
        if len(line) > 99:
            issues.append(issue("info", "line-too-long", i,
                f"Line is {len(line)} characters long.", "Break it up."))
    return issues


# ------------------------------------------------------------ JavaScript ---
def js_syntax_error(code: str):
    """Ask Node.js to parse the code. Returns (line, message) or None.

    Returns None if the code is valid, or if Node is not installed (then the
    syntax check is simply skipped). Code is accepted if it is valid either
    as an ES module or as a CommonJS script.
    """
    node = shutil.which("node")
    if not node:
        return None
    first_error = None
    with tempfile.TemporaryDirectory() as folder:
        for ext in ("mjs", "cjs"):
            path = os.path.join(folder, f"snippet.{ext}")
            with open(path, "w", encoding="utf-8") as f:
                f.write(code)
            try:
                result = subprocess.run([node, "--check", path],
                                        capture_output=True, text=True, timeout=5)
            except (subprocess.TimeoutExpired, OSError):
                return None
            if result.returncode == 0:
                return None
            if first_error is None:
                first_error = result.stderr
    line_match = re.search(r"snippet\.\w+:(\d+)", first_error or "")
    msg_match = re.search(r"SyntaxError: (.*)", first_error or "")
    line = int(line_match.group(1)) if line_match else None
    message = msg_match.group(1).strip() if msg_match else "Invalid syntax"
    return line, message


def analyze_javascript(code: str) -> List[Issue]:
    syntax = js_syntax_error(code)
    if syntax:
        line, message = syntax
        return [issue("error", "syntax-error", line,
                      f"Syntax error: {message}", "Fix the syntax before review.")]
    issues: List[Issue] = []
    for i, line in enumerate(code.splitlines(), 1):
        if re.search(r"\bvar\s", line):
            issues.append(issue("warning", "no-var", i,
                "'var' is function-scoped and easy to misuse.",
                "Use 'let' or 'const'."))
        if "console.log" in line:
            issues.append(issue("info", "no-console", i,
                "Leftover console.log statement.", "Remove or use a logger."))
        if re.search(r"[^=!]==[^=]", line):
            issues.append(issue("warning", "eqeqeq", i,
                "Loose equality '==' can cause type-coercion bugs.",
                "Use '==='."))
        if re.search(r"catch\s*\(\s*\w*\s*\)\s*\{\s*\}", line):
            issues.append(issue("error", "empty-catch", i,
                "Empty catch block silently swallows errors.",
                "Log or handle the error."))
        if re.search(r"\beval\s*\(", line):
            issues.append(issue("error", "no-eval", i,
                "eval() can execute arbitrary code.", "Avoid eval."))
        if len(line) > 100:
            issues.append(issue("info", "max-len", i,
                f"Line is {len(line)} characters long.", "Break it up."))
    return issues


# --------------------------------------------------- LLM (OpenRouter) ---
# The rule-based checks above are fast and exact. The LLM adds a deeper
# "senior engineer" review (logic bugs, security, error handling, design).
LLM_TIMEOUT = 25  # seconds; Spring Boot waits up to 60s for this engine

LLM_SYSTEM_PROMPT = (
    "You are a senior software engineer doing a code review. "
    "Reply with ONLY a JSON array (no markdown, no extra text). "
    "Each item: {\"severity\": \"error|warning|info\", \"line\": <integer or null>, "
    "\"message\": \"what is wrong, one sentence\", \"suggestion\": \"how to fix it, one sentence\"}. "
    "Report at most 6 findings. Focus on logic bugs, security problems, missing error "
    "handling, performance and design. Do NOT report trivial style issues like var, "
    "console.log, print, == vs ===, or long lines (other tools cover those). "
    "Use the line numbers given. If the code is fine, reply with []."
)


def parse_llm_issues(text: str) -> List[Issue]:
    """Turn the model's reply into Issue objects. Never raises."""
    match = re.search(r"\[.*\]", text or "", re.DOTALL)
    if not match:
        return []
    try:
        items = json.loads(match.group(0))
    except json.JSONDecodeError:
        return []
    if not isinstance(items, list):
        return []
    found: List[Issue] = []
    for item in items[:6]:
        if not isinstance(item, dict):
            continue
        message = str(item.get("message", "")).strip()
        if not message:
            continue
        severity = str(item.get("severity", "info")).lower()
        if severity not in ("error", "warning", "info"):
            severity = "info"
        line = item.get("line")
        line = line if isinstance(line, int) and not isinstance(line, bool) and line > 0 else None
        suggestion = item.get("suggestion")
        suggestion = str(suggestion).strip()[:480] if suggestion else None
        found.append(issue(severity, "ai-review", line, message[:480], suggestion))
    return found


AUTO_MODEL = "openrouter/auto"  # OpenRouter picks a working model itself


def call_openrouter(messages, max_tokens: int, timeout: int) -> Optional[str]:
    """Send a chat request to OpenRouter and return the reply text (or None).

    If the configured model has expired / been removed, it retries once with
    OpenRouter's Auto Router so the AI features keep working.
    """
    key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not key:
        return None
    base = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/")

    configured = os.environ.get("OPENROUTER_MODEL", "").strip()
    if configured.lower() in ("", "auto"):
        configured = AUTO_MODEL
    models = [configured] if configured == AUTO_MODEL else [configured, AUTO_MODEL]

    for model in models:
        body = {"model": model, "temperature": 0.2, "max_tokens": max_tokens, "messages": messages}
        request = urllib.request.Request(
            f"{base}/chat/completions",
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Codelens",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                data = json.loads(response.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
        except urllib.error.HTTPError as error:
            # 400/404/503 usually mean the model id is gone or has no provider.
            if error.code in (400, 404, 503) and model != AUTO_MODEL:
                print(f"[llm] model '{model}' not available (HTTP {error.code}); trying {AUTO_MODEL}")
                continue
            print(f"[llm] request failed: HTTP {error.code}")
            return None
        except Exception as error:  # network, timeout, bad JSON...
            print(f"[llm] request failed: {error}")
            return None
    return None


def llm_review(language: str, code: str) -> Optional[List[Issue]]:
    """Ask the LLM for extra findings. Returns None if disabled or it failed."""
    numbered = "\n".join(f"{i}: {text}" for i, text in enumerate(code[:12000].splitlines(), 1))
    messages = [
        {"role": "system", "content": LLM_SYSTEM_PROMPT},
        {"role": "user", "content": f"Language: {language}\n\nCode (with line numbers):\n{numbered}"},
    ]
    text = call_openrouter(messages, 900, LLM_TIMEOUT)
    if text is None:
        return None
    return parse_llm_issues(text)


# ------------------------------------------------------------ AI fixing ---
FIX_TIMEOUT = 50          # seconds (Spring Boot waits up to 60)
MAX_FIX_CHARS = 12000

FIX_SYSTEM_PROMPT = (
    "You are a senior software engineer. You are given source code and a list of "
    "problems found in it. Rewrite the FULL code with those problems fixed. "
    "Keep the same behaviour, names and structure wherever possible; change only what is needed. "
    "Reply with exactly one markdown code block containing the complete corrected code, "
    "and after the block a short bullet list (max 6 bullets) of what you changed."
)


class FixRequest(BaseModel):
    language: str
    code: str
    issues: List[Issue] = []


class FixResponse(BaseModel):
    fixedCode: Optional[str] = None
    explanation: Optional[str] = None
    error: Optional[str] = None


def extract_fixed_code(text: str):
    """Pull the code block and the explanation out of the model reply."""
    match = re.search(r"```[\w+#.-]*\r?\n(.*?)```", text or "", re.DOTALL)
    if not match:
        return None, None
    code = match.group(1).rstrip()
    explanation = ((text[:match.start()] + text[match.end():]).strip())[:1500]
    return code, (explanation or None)


def score_and_summary(issues: List[Issue]):
    e = sum(i.severity == "error" for i in issues)
    w = sum(i.severity == "warning" for i in issues)
    n = sum(i.severity == "info" for i in issues)
    score = max(5, min(100, 100 - e * 20 - w * 8 - n * 3))
    if any(i.rule == "syntax-error" for i in issues):
        return 10, "Syntax error: this code cannot run. Fix it first."
    if e:
        summary = f"{e} likely bug{'s' if e > 1 else ''} found - fix before merging."
    elif w:
        summary = "No bugs found, but a few style issues are worth fixing."
    else:
        summary = "Looks solid. Only minor suggestions." if n else "Clean code."
    return score, summary


@app.get("/health")
def health():
    return {"status": "ok", "llm_enabled": bool(os.environ.get("OPENROUTER_API_KEY", "").strip())}


@app.post("/fix", response_model=FixResponse, dependencies=[Depends(require_engine_key)])
def fix(req: FixRequest):
    """Return an AI-corrected version of the code. Always answers HTTP 200;
    problems are reported in the `error` field so the UI can show them."""
    if not os.environ.get("OPENROUTER_API_KEY", "").strip():
        return FixResponse(error="AI fixing is not set up. Add OPENROUTER_API_KEY to ai-engine/.env and restart the engine.")
    if not req.code.strip():
        return FixResponse(error="There is no code to fix.")
    if len(req.code) > MAX_FIX_CHARS:
        return FixResponse(error=f"Code is too long for automatic fixing (max {MAX_FIX_CHARS} characters).")

    problems = "\n".join(
        f"- line {i.line}: {i.message}" if i.line else f"- {i.message}" for i in req.issues[:20]
    ) or "- (none listed; fix any bugs and quality problems you see)"
    messages = [
        {"role": "system", "content": FIX_SYSTEM_PROMPT},
        {"role": "user", "content": f"Language: {req.language}\n\nProblems:\n{problems}\n\nCode:\n{req.code}"},
    ]
    text = call_openrouter(messages, 4000, FIX_TIMEOUT)
    if text is None:
        return FixResponse(error="The AI model did not answer. Check your key and try again.")
    code, explanation = extract_fixed_code(text)
    if code is None:
        return FixResponse(error="The AI reply did not contain code. Please try again.")
    return FixResponse(fixedCode=code, explanation=explanation)


@app.post("/analyze", response_model=AnalyzeResponse, dependencies=[Depends(require_engine_key)])
def analyze(req: AnalyzeRequest):
    if not req.code.strip():
        return AnalyzeResponse(score=0, summary="No code submitted.", issues=[])
    lang = req.language.lower()
    issues = analyze_python(req.code) if lang == "python" else analyze_javascript(req.code)

    ai_used = False
    if not any(i.rule == "syntax-error" for i in issues):
        ai_issues = llm_review(lang, req.code)
        if ai_issues is not None:
            ai_used = True
            issues.extend(ai_issues)

    issues.sort(key=lambda x: (x.line or 0))
    score, summary = score_and_summary(issues)
    if ai_used:
        summary += " (includes AI review)"
    return AnalyzeResponse(score=score, summary=summary, issues=issues)
