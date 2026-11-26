---
description: Reglas base de arquitectura, reparto de agentes y activación inteligente de skills.
globs: ["**/*"]
alwaysApply: true
---

# Reglas de Oro del Proyecto

1. **Claridad total:** Escribe código limpio y directo para que un principiante pueda leerlo y entenderlo a la primera.
2. **Revisión previa:** Antes de crear cualquier archivo, componente o función, busca en el proyecto (primero mediante el grafo de Graphify) si ya existe algo similar para reutilizarlo.
3. **Estructura de carpetas estricta:**
   - `src/pages/`: Solo pantallas completas y rutas.
   - `src/components/`: Piezas visuales agrupadas y reutilizables.
   - `src/data/`: Todo lo relacionado con guardar datos (saving), llamadas a API/base de datos y autenticación (logins).
4. **Un trabajo por archivo:** Cada archivo hace una sola cosa (`one job per file`).
5. **Límite de 300 líneas:** Ningún archivo puede superar las 300 líneas. Si se acerca a 250, divídelo en piezas más pequeñas.
6. **Persistencia:** Cualquier regla nueva que acordemos se guarda en `.agents/rules/`.

# Flujo de Trabajo y Reparto de Agentes

1. **Exploración y Memoria (`graphify` + Subagente `research`):**
   - Antes de leer archivos a ciegas, consulta el grafo en `graphify-out/graph.json` con `graphify query`, `graphify path` o `graphify explain`.
   - Si hace falta investigar muchas rutas o documentación, delega en el subagente `research` para no ensuciar el contexto principal.
   - Tras cualquier edición de código, ejecuta `graphify update .` (AST local, 0 tokens).
2. **Economía de Código y Tokens (`ponytail`):**
   - Actúa por defecto en modo `ponytail` (`full`): el mejor código es el que no hace falta escribir. Haz el cambio mínimo completo que resuelve el problema real, sin abstracciones prematuras ni sobreingeniería.
3. **Planificación y Ejecución Paralela (`writing-plans` + Subagentes `self` / `dispatching-parallel-agents`):**
   - En tareas grandes (>2 archivos), activa `writing-plans` antes de tocar código.
   - Cuando haya subtareas independientes (por ejemplo: un componente en `src/components/` y un servicio en `src/data/`), repártelas en subagentes paralelos o sigue `subagent-driven-development`.
4. **Diseño UI/UX Anti-Slop (`taste-skill`, `impeccable`, `unslop`, `ui-ux-pro-max`, `emilkowalski/skills`):**
   - En pantallas y componentes nuevos, aplica `taste-skill` (`design-taste-frontend`), `impeccable` y `unslop` para evitar diseños genéricos de IA.
   - Para animaciones, gestos y experiencia móvil nativa (PWA/iOS-like), usa `animate`, `choreograph`, `gestures`, `apple-design` y `mobile-native`.
5. **Calidad, Debugging y Revisión (`systematic-debugging`, `test-driven-development`, `ponytail-review`):**
   - Si algo falla o no funciona a la primera, detente inmediatamente y activa `systematic-debugging` (prohibido parchar a ciegas).
   - Antes de dar por terminada una tarea, verifica con `verification-before-completion` y revisa el diff con `ponytail-review`.
