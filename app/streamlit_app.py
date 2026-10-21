"""Streamlit entry point forwarder for QuantumRoute."""

import os
import sys

# Prevent OpenMP / libgomp static TLS allocation segfault on Linux in threaded environments
_preload = os.environ.get("LD_PRELOAD", "")
if "libgomp" not in _preload:
    _app_dir = os.path.dirname(os.path.abspath(__file__))
    _root = os.path.abspath(os.path.join(_app_dir, ".."))
    _aer_libs = os.path.join(_root, ".venv", "lib", "python3.14", "site-packages", "qiskit_aer.libs")
    _target = None
    if os.path.isdir(_aer_libs):
        for _f in os.listdir(_aer_libs):
            if _f.startswith("libgomp") and ".so" in _f:
                _target = os.path.join(_aer_libs, _f)
                break
    if _target:
        os.environ["LD_PRELOAD"] = f"{_target} {_preload}".strip()
        os.execv(sys.executable, [sys.executable] + sys.argv)

# Ensure src is in python path
src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

try:
    from quantumroute.app import main
except ModuleNotFoundError:
    from src.quantumroute.app import main

if __name__ == "__main__":
    main()
