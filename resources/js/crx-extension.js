export default class CRXExtension{

    /**
     * New instance
     * @param {*} url
     */
    constructor(url){
        let rules = "^https:\/\/(chrome\.google\.com\/webstore|chromewebstore\.google\.com)\/detail\/([a-zA-Z0-9\-]*)\/([a-zA-Z0-9]*)(?:\\?.*)?$";
        console.log('CRXExtension constructor - URL:', url);
        console.log('CRXExtension constructor - Regex:', rules);
        let matches = url.match(rules);
        console.log('CRXExtension constructor - Matches:', matches);
    
        if(matches === null || typeof matches[2] === "undefined" || typeof matches[3] === "undefined")
            throw "Following URL is probably incorrect : "+url;

        this.url = url;
        this.name = matches[2];
        this.extensionId = matches[3];
        console.log('CRXExtension constructor - Created:', { name: this.name, extensionId: this.extensionId });
    }

    /**
     * Trigger download on a new tab
     * @param {string} format 
     * @param {boolean} forceDownload 
     */
    triggerDownload(format, forceDownload){
        // Build download url
        let download_url = "/download/"+this.name+"."+format+"?url="+this.url+(forceDownload == true ? '&force_dl=true' : '');

        // Launch download on a new transparent tab
        return window.open(download_url, "_self");
    }
}