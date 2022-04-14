/**
 * @file Access to Sauce Nao image search
 */

import Axios from "axios";
import {URLSearchParams} from "url";

export interface SauceNAOResponse {
    results: SauceNAOResponseImage[]
}

interface SauceNAOResponseImageHeader {
    similarity: string;
    thumbnail: string;
    index_id: number;
    index_name: string;
    dupes: number;
    hidden: number;
}

interface SauceNAOResponseImageData {
    ext_urls: string[];
    title: string;
    author_name: string;
    author_url: string;
}

interface SauceNAOResponseImage {
    header: SauceNAOResponseImageHeader,
    data: SauceNAOResponseImageData,
}

/**
 * Get image data from SauceNao
 * @param imageURL Image URL
 */
export async function getSauceNaoImageData(imageURL: string) : Promise<SauceNAOResponse> {

    // Form Sauce Nao API request
    const queryParams : {[x: string] : string} = {
        api_key: "b104eebc21f184e229344b0e8af365bef47e7479",
        db: "999",
        output_type: "2",
        numres: "1",
        url: imageURL,
    }

    let queryEncodedParams = new URLSearchParams(queryParams);

    // Send request
    // Respond with data if no errors
    // Respond with null if errors occur
    return Axios.post(`https://saucenao.com/search.php?${queryEncodedParams}`)
        .then((data) => {
            if (data.status === 200) {
                return data.data;
            }
            console.error("Failed to retrieve image from SauceNao.");
            console.error(data.statusText);
            return null;
        })
        .catch((err) => {
            console.error(err);
            return null;
        })
}