import { authRoutes } from "./auth/auth.routes.js";
import { householdsRoutes } from "./households/households.routes.js";
import { categoriesRoutes } from "./categories/categories.routes.js";
import { tasksRoutes } from "./tasks/tasks.routes.js";
import { shoppingRoutes } from "./shopping/shopping.routes.js";
import { backupRoutes } from "./backup/backup.routes.js";

export const modules = [
  { basePath: "/auth", factory: authRoutes },
  { basePath: "/households", factory: householdsRoutes },
  { basePath: "/categories", factory: categoriesRoutes },
  { basePath: "/tasks", factory: tasksRoutes },
  { basePath: "/shopping", factory: shoppingRoutes },
  { basePath: "/backup", factory: backupRoutes },
];
