#!/usr/bin/env bash
set -euo pipefail

REPO_RAW_BASE="${AGENT_BRAIN_RAW_BASE:-https://raw.githubusercontent.com/hachhyy/agent-brain-hq/main}"

echo "==> [1/5] Descargando reglas base, workflow de Graphify y skills-lock.json..."
mkdir -p .agents/rules .agents/workflows

download_or_keep() {
  local rel_path="$1"
  local tmp_file
  tmp_file="$(mktemp)"
  if curl -fsSL "${REPO_RAW_BASE}/${rel_path}" -o "${tmp_file}" 2>/dev/null; then
    mv "${tmp_file}" "${rel_path}"
    echo "    ✓ Descargado ${rel_path}"
  else
    rm -f "${tmp_file}"
    if [ -f "${rel_path}" ]; then
      echo "    • Usando copia local existente de ${rel_path}"
    else
      echo "    ✗ Error: No se pudo descargar ${rel_path} desde ${REPO_RAW_BASE}" >&2
      return 1
    fi
  fi
}

download_or_keep ".agents/rules/brain.md"
download_or_keep ".agents/rules/graphify.md"
download_or_keep ".agents/workflows/graphify.md"
download_or_keep "skills-lock.json"

echo "==> [2/5] Instalando las skills de skills-lock.json y UI/UX Pro Max..."
npx -y skills experimental_install -a antigravity -y
npx -y ui-ux-pro-max-cli init --ai antigravity

echo "==> [3/5] Optimizando design-taste-frontend para evitar timeouts en list_skills..."
if [ -d ".agents/skills/design-taste-frontend" ]; then
  if [ -d ".agents/skills/design-taste-frontend/assets" ] || [ "$(find .agents/skills/design-taste-frontend -type f | wc -l)" -gt 5 ]; then
    mkdir -p .agents/taste-skill-ref
    rm -rf .agents/taste-skill-ref/design-taste-frontend
    mv .agents/skills/design-taste-frontend .agents/taste-skill-ref/design-taste-frontend
  fi
fi

if [ -d ".agents/taste-skill-ref/design-taste-frontend" ]; then
  mkdir -p .agents/skills/design-taste-frontend
  cat << 'EOF' > .agents/skills/design-taste-frontend/SKILL.md
---
name: design-taste-frontend
description: Senior UI/UX Engineer suite for high-craft, anti-slop frontend architecture, typography, motion, layout, and visual taste.
---

# Design Taste Frontend (Lightweight Wrapper)

The full instructions and 1,631 reference assets for `design-taste-frontend` have been moved to `.agents/taste-skill-ref/design-taste-frontend/` to prevent `list_skills` indexing timeouts in Antigravity.

## How to Use

Before designing or building frontend UI/UX components or pages, read the full skill specification directly using `view_file`:

- **Full Skill Specification:** `.agents/taste-skill-ref/design-taste-frontend/SKILL.md`
- **Reference Assets Directory:** `.agents/taste-skill-ref/design-taste-frontend/`
EOF
  echo "    ✓ Wrapper ligero creado en .agents/skills/design-taste-frontend/SKILL.md"
fi

echo "==> [4/5] Configurando Graphify (AST knowledge graph local, 0 tokens)..."
export PATH="$HOME/.local/bin:$PATH"
if ! command -v uv >/dev/null 2>&1; then
  echo "    • Instalando uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi

if ! command -v graphify >/dev/null 2>&1; then
  echo "    • Instalando graphifyy con uv tool install..."
  uv tool install graphifyy
fi

if ! grep -q '\.local/bin' "$HOME/.bashrc" 2>/dev/null; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
fi

echo "    • Registrando skill y reglas de Graphify en Antigravity..."
graphify antigravity install --project >/dev/null 2>&1 || true

echo "    • Ejecutando graphify update . ..."
graphify update . || true

echo "==> [5/5] Verificando respaldo en ~/.gemini/agents-backup/ ..."
if [ -d "$HOME/.gemini/agents-backup" ]; then
  mkdir -p "$HOME/.gemini/agents-backup/.agents/rules" "$HOME/.gemini/agents-backup/.agents/workflows"
  cp -f .agents/rules/brain.md "$HOME/.gemini/agents-backup/.agents/rules/brain.md"
  cp -f .agents/rules/graphify.md "$HOME/.gemini/agents-backup/.agents/rules/graphify.md"
  cp -f .agents/workflows/graphify.md "$HOME/.gemini/agents-backup/.agents/workflows/graphify.md"
  cp -f skills-lock.json "$HOME/.gemini/agents-backup/skills-lock.json"
  cp -f bootstrap.sh "$HOME/.gemini/agents-backup/bootstrap.sh" 2>/dev/null || true
  echo "    ✓ Copia de respaldo actualizada en ~/.gemini/agents-backup/"
else
  echo "    • ~/.gemini/agents-backup/ no existe (omitido)."
fi

SKILL_COUNT="$(find .agents/skills -maxdepth 1 -mindepth 1 -type d | wc -l | tr -d ' ')"
echo "==> ¡Bootstrap completado con éxito! ${SKILL_COUNT} skills activas, Graphify listo y Ponytail en modo full."
