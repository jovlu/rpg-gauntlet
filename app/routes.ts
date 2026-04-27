import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("map", "routes/map.tsx"),
  route("fight/:enemyid", "routes/fight.tsx"),
  route("congrats", "routes/congrats.tsx"),
  route("support/qtes", "routes/support-qtes.tsx"),
] satisfies RouteConfig;
