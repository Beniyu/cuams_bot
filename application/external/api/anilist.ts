/**
 * Access to anilist data for anime
 */
import Axios, {AxiosRequestConfig} from "axios";

const standardSchema = `
query ($id: Int) {
  Media (id: $id, type: ANIME) {
    id
    title {
      romaji
      english
      native
    }
  }
}
`
export interface AnilistResponse {
    id: number,
    title: {
        romaji: string,
        english: string,
        native: string,
    }
}

export async function getAnilistData(animeID: number) : Promise<AnilistResponse> {

    // Form post request to API
    const postRequestData = {
        query: standardSchema,
        variables: { id: animeID },
    }

    const postRequestConfig : AxiosRequestConfig = {
        headers: {
            'Content-Type': "application/json",
            'Accept': "application/json",
        }
    }

    // Send request
    // Respond with data if no errors
    // Respond with null if errors occur
    return Axios.post("https://graphql.anilist.co", postRequestData, postRequestConfig)
        .then(data => {
            if (data.status === 200) {
                return data.data.data.Media;
            }
            console.error("Error while retrieving data from Anilist");
            return null;
        })
        .catch(err => {
            console.error(err);
            return null;
        });
}