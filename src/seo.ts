
export function setTitle(title: string){
    window.document.title = title;
}

export function setDescription(description: string){
    createMetaTag('description', description);
}

export function setKeywords(keywords: string){
    createMetaTag('keywords', keywords);
}

export function setGraphData(type: string, content: string){
    createOGTag(type, content);
}

export function setCanonical(href: string){
    createLinkTag('canonical', href);
}

function createLinkTag(rel: string, href: string){
    const existingTag = document.querySelector(`link[rel='${rel}']`) as HTMLLinkElement;

    if(existingTag !== null){
        existingTag.href = href;
        return;
    }

    const tag = document.createElement('link') as HTMLLinkElement;

    tag.rel = rel;
    tag.href = href;

    document.head.appendChild(tag);
}

function createMetaTag(name: string, content: string){
    const existingTag = document.querySelector(`meta[name='${name}']`) as HTMLMetaElement;

    if(existingTag !== null){
        existingTag.content = content;
        return;
    }

    const metaTag = document.createElement('meta') as HTMLMetaElement;

    metaTag.name = name;
    metaTag.content = content;

    document.head.appendChild(metaTag);
}

export function createOGTag(property: string, content: string){
    const existingTag = document.querySelector(`meta[property='${property}']`) as HTMLMetaElement;

    if(existingTag !== null){
        existingTag.content = content;
        return;
    }

    const metaTag = document.createElement('meta') as HTMLMetaElement;
    metaTag.setAttribute('property', property);
    metaTag.content = content;

    document.head.appendChild(metaTag);
}