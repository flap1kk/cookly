# cookly

## Responsibilities

Проект разделен по технологическим специализациям. Каждый участник команды отвечает за свой слой системы.

### 🎨 Frontend (Клиентская часть)

* **Ответственный:** Алексей
* **Стек:** HTML5, CSS3, Vanilla JS
* **Команда:** Федор Африкантов, Алексей Кривошапкин

---

### ⚙️ Backend (Серверная часть)

* **Ответственный:** me (@flap1kk - Арсений)
* **Стек:** Hono (Node.js runtime), PostgreSQL
* **Команда:** Арсений Филатов, Дмитрий Ильин

---

### 🕵️‍♂️ QA Engineering (тестики)

* **Ответственный:** НИКОЛ
* **Стек:** DevTools, Postman
* **Команда:** Никол Симонян, Полина Ефимычева

---

### ✍️ Content Management (наполнение)

* **Ответственная:** Лиза Аферова
* **Стек:** Открытые веб-ресурсы, Excel
* **Команда:** ЛИЗА АФЕРОВА!


 

## API implementation

The backend implements the API described in `api-doc.txt`. Route/controller files are separated by entity and delegate all business logic to services:

- `backend/src/app/routes/ingredients.ts` — thin controller for `GET /api/ingredients/search?q=...`
- `backend/src/app/routes/recipes.ts` — thin controller for recipe search, recipe details, and ingredient-based matching
- `backend/src/app/services/ingredient.service.ts` — input validation and ingredient response DTOs
- `backend/src/app/services/recipe.service.ts` — input validation, recipe response DTOs, nutrition calculation (КБЖУ), and business rules for ingredient-based search
- `backend/src/app/services/api-service.error.ts` — service exception mapping and safe Russian-language API error responses
- `backend/src/app/entity/prisma-implementation/` — repository adapters that query the existing database

The request flow is: route/controller → service → repository → database. Services own validation and response shaping; unexpected repository/runtime exceptions are logged on the server and converted into a safe `{ message: "..." }` response, without exposing database details.

The API listens on port `3000` by default (`PORT` can override it). Set `DATABASE_URL` to a PostgreSQL database where the project's existing schema and data are available. The API does not modify the recipe or ingredient data files.

The ingredient picker and recipe-name dropdown use a 250 ms debounce. Recipe details are loaded by ID when a recipe is opened. For browser compatibility, ingredient-based matching accepts POST JSON `{ "ids": [1, 2] }` as well as the documented GET endpoint (`?ids=1,2` is also supported).
