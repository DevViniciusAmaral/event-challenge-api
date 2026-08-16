import { tasteDiv } from "../../config/tastedive";
import type { Movie } from "./movie.type";

export async function listMovies(): Promise<Movie[]> {
  const results = await tasteDiv.getMovies();

  return results.map((result) => ({
    name: result.name,
    youtubeUrl: result.yUrl,
    description: result.description,
  }));
}
