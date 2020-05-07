export namespace ArtistSearch {
    export interface Artist {
        id: number;
        name: string;
        tabscount: number;
        artist_url: string;
        tabs_last_update_timestamp: number;
    }

    export interface ArtistSearchData {
        artists: Artist[];
        alpha: string;
        current_page: number;
        artists_count: string;
        tabs_per_page: number;
        page_count: number;
    }
}

export namespace GeneralSearch {
    export interface SearchData {
        search_query: string;
        search_query_type: string;
        results_count: number;
        results: Result[];
        pagination: Pagination;
        spellcheck: string;
        not_found: boolean;
    }
    export interface Pagination {
        total: number;
        current: number;
    }
    export interface Result {
        id?: number;
        song_id?: number;
        song_name: string;
        artist_id?: number;
        artist_name: string;
        type?: string;
        part?: string;
        version?: number;
        votes?: number;
        rating?: number;
        date?: string;
        status?: string;
        preset_id?: number;
        tab_access_type?: string;
        tp_version?: number;
        tonality_name?: string;
        version_description?: null | string;
        verified?: number;
        artist_url: string;
        tab_url: string;
        marketing_type?: string;
        device?: null;
        app_link?: string;
        tracks?: string;
        duration?: string;
    }
}
