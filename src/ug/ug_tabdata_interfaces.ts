// generated in part by http://json2ts.com/

export interface Tab {
    id: number;
    song_id: number;
    song_name: string;
    artist_id: number;
    artist_name: string;
    type: string;
    part: string;
    version: number;
    votes: number;
    rating: number;
    date: string;
    status: string;
    preset_id: number;
    tab_access_type: string;
    tp_version: number;
    tonality_name: string;
    version_description: string;
    verified: number;
    recording: Recording;
    artist_url: string;
    tab_url: string;
    date_update: string;
    user_id: number;
    user_iq: number;
    username: string;
    type_name: string;
    best_pro_tab_url: string;
}

export interface Recording {
    is_acoustic: number;
    tonality_name: string;
    performance?: any;
    recording_artists: any[];
}

export interface Contributor {
    userid: string;
    username: string;
    usergroupid: string;
    iq: number;
}

export interface Strumming {
    part: string;
    denuminator: number;
    bpm: number;
    is_triplet: number;
    measures: Measure[];
}

export interface Measure {
    measure: number;
}

export interface Version {
    id: number;
    song_id: number;
    song_name: string;
    artist_id: number;
    artist_name: string;
    type: string;
    part: string;
    version: number;
    votes: number;
    rating: number;
    date: string;
    status: string;
    preset_id: number;
    tab_access_type: string;
    tp_version: number;
    tonality_name: string;
    version_description: string;
    verified: number;
    recording: Recording;
    artist_url: string;
    tab_url: string;
    date_update: string;
    user_id: number;
    user_iq: number;
    username: string;
    type_name: string;
    best_pro_tab_url: string;
}

export interface Stats {
    view_total: string;
    favorites_count: string;
}

export interface WikiTab {
    content: string;
    revision_id: number;
    user_id: number;
    username: string;
    date: number;
}

export interface Tuning {
    name: string;
    value: string;
    index: number;
}

export interface Meta {
    capo: number;
    tonality: string;
    tuning: Tuning;
    difficulty: string;
}

export interface ListCapos {
    fret: number;
    startString: number;
    lastString: number;
    finger: number;
}

export interface ListCapos {
    fret: number;
    startString: number;
    lastString: number;
    finger: number;
}

export interface ChordApplicature {
    id: string;
    listCapos: ListCapos[];
    noteIndex: number;
    notes: number[];
    frets: number[];
    fingers: number[];
    fret: number;
}
export type Applicature = {[chord: string]: ChordApplicature}

export interface LastComment {
    id: string;
    rowid: string;
    text: string;
    author_userid: string;
    rating: string;
    userid: string;
    usergroupid: string;
    username: string;
    date_created: string;
    type: string;
    parent_id: number;
    added_from: string;
    updated_at?: any;
    status: string;
    moderator_user_id: string;
    likes_count: string;
    dislikes_count: string;
    contributor_level: string;
    avatar: string;
    date: number;
    user_iq: number;
    level: number;
}

export interface TabView {
    wiki_tab: WikiTab;
    contributors: Contributor[];
    strummings: Strumming[];
    has_hq_description: number;
    blocked: boolean;
    adsupp_binary_blocked?: any;
    meta: Meta;
    has_official_version: boolean;
    has_chord_pro: boolean;
    has_preset: boolean;
    versions: Version[];
    song_image: boolean;
    applicature: Applicature;
    last_comments: LastComment[];
    comments: number;
    stats: Stats;
    tab_corrects: any[];
    is_simplify_available: boolean;
    can_edit_tab: boolean;
    can_edit_strumming: boolean;
    can_send_tab_stats: boolean;
    official_backingtrack?: any;
    tab_search_link: string;
    wiki_tab_user_group_id: number;
    wiki_tab_user_iq: number;
    user_group_id: number;
    count_rating: number;
    encode_strummings: string;
    alert?: any;
    recommendations: Recommendation[];
    official_backingtrack_url: string;
    official_tab_url: string;
    official_tab_want?: any;
    tab_manually_highlighted: boolean;
    pro_tab_onbording?: any;
    smart_auto_scroll_available: boolean;
    lyrics_lines: any[];
}

export interface Recommendation {
    id: number;
    song_id: number;
    song_name: string;
    artist_id: number;
    artist_name: string;
    type: string;
    part: string;
    version: number;
    votes: number;
    rating: number;
    date: string;
    status: string;
    preset_id: number;
    tab_access_type: string;
    tp_version: number;
    tonality_name: string;
    version_description: string;
    verified: number;
    recording: Recording;
    artist_url: string;
    tab_url: string;
    date_update: string;
    user_id: number;
    user_iq: number;
    username: string;
    type_name: string;
    best_pro_tab_url: string;
}

export interface UGPageData {
    tab: Tab;
    tab_view: TabView;
}
