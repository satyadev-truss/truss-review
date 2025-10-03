import giphyApi from "giphy-api";

export class GiphyService {
  private client: any;

  constructor(apiKey: string) {
    this.client = giphyApi(apiKey);
  }

  async searchGif(searchTerm: string): Promise<string | null> {
    try {
      console.log(`🔍 Searching Giphy for: "${searchTerm}"`);

      const result = await this.client.search({
        q: searchTerm,
        limit: 1, // Get top result only
        rating: "pg", // PG-rated content (work-safe but more variety)
      });

      console.log(`📊 Giphy API response:`, {
        dataLength: result.data?.length || 0,
        pagination: result.pagination,
      });

      if (result.data && result.data.length > 0) {
        const gifUrl = result.data[0].images.original.url;

        console.log(`✅ Found GIF:`, {
          url: gifUrl,
          title: result.data[0].title,
          id: result.data[0].id,
        });
        return gifUrl;
      }

      console.log(`❌ No GIFs found for term: "${searchTerm}"`);
      return null;
    } catch (error) {
      console.error("❌ Error searching Giphy:", error);
      return null;
    }
  }
}
