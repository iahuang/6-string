declare interface SongResult {
    songName: string;
    artistName: string;
    artistUrl: string;
    categories: { category: string; url: string }[];
}
declare interface ProcessedSearchResults {
    results: SongResult[];
    numberTotalResults: number;
}