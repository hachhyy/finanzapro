---
description: Reglas base de arquitectura y activación inteligente de skills.
globs: ["**/*"]
alwaysApply: true
---

# Reglas de Oro del Proyecto

1. **Claridad total:** Escribe código limpio y directo para que un principiante pueda leerlo y entenderlo a la primera.
2. **Revisión previa:** Antes de crear cualquier archivo, componente o función, busca en el proyecto si ya existe algo similar para reutilizarlo.
3. **Estructura de carpetas estricta:**
   - `src/pages/`: Solo pantallas completas y rutas.
   - `src/components/`: Piezas visuales agrupadas y reutilizables.
   - `src/data/`: Todo lo relacionado con guardar datos (saving), llamadas a API/base de datos y autenticación (logins).
4. **Un trabajo por archivo:** Cada archivo hace una sola cosa (`one job per file`).
5. **Límite de 300 líneas:** Ningún archivo puede superar las 300 líneas. Si se acerca a 250, divídelo en piezas más pequeñas.
6. **Persistencia:** Cualquier regla nueva que acordemos se guarda en `.agents/rules/`.

# Cuándo usar las Skills automáticamente (Solo si aplica)
No cargues todas las skills a la vez. Activa solo la que corresponda según la tarea:
- **Explorar o entender el proyecto (sin releer todo):** Si existe `graphify-out/graph.json`, consulta primero con `graphify query`, `graphify path` o `graphify explain` (y actualiza con `graphify update .` tras editar código). Si no existe el grafo aún, usa `graphify` para generarlo.
- **Optimizar código y tokens:** Usa `ponytail` (`full` por defecto) para escribir el cambio mínimo completo, reutilizar lo existente y evitar sobreingeniería o líneas innecesarias.
- **Tareas grandes (>2 archivos):** Usa `writing-plans` antes de tocar código.
- **Pantallas y componentes nuevos:** Usa `taste-skill` por defecto para evitar diseños genéricos de IA.
- **Errores o fallos:** Si algo se rompe o no funciona a la primera, detente y activa `systematic-debugging`.
