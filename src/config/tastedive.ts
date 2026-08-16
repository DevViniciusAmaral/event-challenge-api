import axios from 'axios'

export interface ShowResponse {
    similar: Similar
}

export interface Similar {
    info: Info[]
    results: Result[]
}

export interface Info {
    name: string
    type: string
}

export interface Result {
    name: string
    wUrl: any
    yUrl: any
    yID: any
    description: string
}

export const tasteDiveApi = axios.create({
    baseURL: process.env.TASTE_DIVE_API_URL,
    params: { k: process.env.TASTE_DIVE_API_KEY },
})

export const tasteDiv = {
    getMovies: async () => {
        const { data } = await tasteDiveApi.get<ShowResponse>(`?q=movie&type=movie&info=1&slimit=10&limit=10`)
        return data.similar.results
    }
}
