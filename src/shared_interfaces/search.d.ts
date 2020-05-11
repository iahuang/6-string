declare interface SongResult {
    songName: string;
    artistName: string;
    artistUrl: string;
    categories: { category: string; url: string }[];
}

declare interface ProcessedSearchResults {
    results: SongResult[];
    numberTotalResults: number;
    totalPages: number;
    currentPage: number; // the page that was searched; a bit redundant but whatever
}