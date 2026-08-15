# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = "Consoleri"
copyright = "2026, Rusta Atai"
author = "Rusta Atai"

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

language = "en"
extensions = [
    "sphinxcontrib.mermaid",
]

templates_path = []
exclude_patterns = []

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = "alabaster"
html_static_path = []
html_baseurl = "https://atai.github.io/consolieri-desktop/"
html_context = {
    "display_github": True,
    "github_user": "atai",
    "github_repo": "consolieri-desktop",
    "github_version": "main",
    "conf_py_path": "/docs/source/",
}
