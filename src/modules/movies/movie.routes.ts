import Elysia from "elysia";
import * as movieService from "./movie.service";
import { internalError } from "../../shared/errors";

export const movieRoutes = new Elysia({ prefix: "/movies" }).get(
  "/",
  async ({ set }) => {
    try {
      const movies = await movieService.listMovies();
      return movies;
    } catch (err) {
      console.log(err)
      set.status = 500;
      return internalError();
    }
  },
  {
    detail: {
      summary: "Listar filmes",
      tags: ["Filmes"],
    },
  }
);
