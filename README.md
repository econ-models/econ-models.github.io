# Econ Model · 经济学模型笔记

Static site (GitHub Pages) generated from the LaTeX notes *Economic Models* (Zhiren Hu).

- Source: `../src/Model.tex` + `../src/literature.bib` (kept outside this repo).
- Build: `python ../build.py` → rewrites `notes/` (one HTML fragment per paper, KaTeX pre-rendered), `notes/index.json`, `search.json`.
- Requires Python 3 and Node (`../tools/node_modules/katex`).
- Layout: top tabs = `\section`; left sidebar = `\subsection` → `\subsubsection` (one page per paper).
