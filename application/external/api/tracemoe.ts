/**
 * @file Access to trace moe image search
 */

import Axios from "axios";

export interface TraceMoeResponse {
    frameCount: number;
    error: string;
    result: TraceMoeResponseImage[];
}

interface TraceMoeResponseImage {
    anilist: number;
    filename: string;
    episode: number | string | number[] | null;
    from: number;
    to: number;
    similarity: number;
    video: string;
    image: string;
}

/**
 * Get image data from trace moe
 * @param imageURL Image URL
 */
export async function getTraceMoeImageData(imageURL: string) : Promise<TraceMoeResponse> {

    // Form post request to API
    const queryParams : {[x: string]: string} = {
        "url": imageURL,
    }

    let queryEncodedParams = new URLSearchParams(queryParams);

    // Send request
    // Respond with data if no errors
    // Respond with null if errors occur
    return Axios.get("https://api.trace.moe/search?" + queryEncodedParams)
        .then((data) => {
            if (data.status === 200) {
                return data.data as TraceMoeResponse;
            }
            console.error("Error while fetching data from Trace Moe");
            return null;
        })
        .catch((err) => {
            console.error(err);
            return null;
        })
}