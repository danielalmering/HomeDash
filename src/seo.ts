
export function setTitle(title: string){
    window.document.title = title;
}

export function setDescription(description: string){
    createTag('description', description);
}

export function setKeywords(keywords: string){
    createTag('keywords', keywords);
}

export function setGraphData(type: string, content: string){
    createOGTag(type, content);
}

function createTag(name: string, content: string){
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
        console.log('hi');
        return;
    }

    console.log('hey');

    const metaTag = document.createElement('meta') as HTMLMetaElement;
    metaTag.setAttribute('property', property);
    metaTag.content = content;

    document.head.appendChild(metaTag);
    console.log(metaTag);
}