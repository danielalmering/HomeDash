
export interface SeoText {
    id: number;
    description: string;
    image_location: string;
    image_position: string;
    image_title: string;
    order: number;
    title: string;
}

export interface SeoData {
    id: number;
    language: string;
    slug: string;
    meta_description: string;
    meta_keywords: string;
    meta_title: string;
    texts: SeoText[];
}
