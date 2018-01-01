// import * as FS from 'fs';
// import * as Path from 'path';

import { inspect } from 'util';

import {
    DefaultTheme, Renderer, UrlMapping,
    Reflection, DeclarationReflection, ProjectReflection,
    NavigationItem
} from 'typedoc';

// why is this not exported from 'typedoc'
import { PageEvent } from 'typedoc/dist/lib/output/events';

export default class Theme extends DefaultTheme {
    /**
     * Create a new DefaultTheme instance.
     *
     * @param renderer  The renderer this theme is attached to.
     * @param basePath  The base path of this theme.
     */
    constructor(renderer: Renderer, basePath: string) {
        super(renderer, basePath);

        // renderer.removeComponent('assets');
        // renderer.removeComponent('javascriptIndex');
        // renderer.removeComponent('navigation');
        // renderer.removeComponent('toc');

        this.listenTo(renderer, PageEvent.BEGIN, this.onRendererBeginPage);
    }

    /**
     * Test whether the given path contains a documentation generated by this theme.
     *
     * @param path  The path of the directory that should be tested.
     * @returns     TRUE if the given path seems to be a previous output directory,
     *              otherwise FALSE.
     */

    // isOutputDirectory(path: string): boolean {
    //     if (!FS.existsSync(Path.join(path, 'index.html'))) {
    //         return false;
    //     }
    //     return true;
    // }

    /**
     * Map the models of the given project to the desired output files.
     *
     * @param project  The project whose urls should be generated.
     * @returns        A list of [[UrlMapping]] instances defining which models
     *                 should be rendered to which files.
     */

    // getUrls(project: ProjectReflection): UrlMapping[] {
    //     const urls: UrlMapping[] = [];
    //     urls.push(new UrlMapping('index.html', project, 'index.hbs'));

    //     project.url = 'index.html';
    //     project.anchor = null;
    //     project.hasOwnDocument = true;

    //     project.children.forEach((child) => {
    //         DefaultTheme.applyAnchorUrl(child, project);
    //     });

    //     return urls;
    // }

    /**
     * Triggered before a document will be rendered.
     *
     * @param page  An event object describing the current render operation.
     */
    private onRendererBeginPage(page: PageEvent) {
        const model = page.model;
        if (!(model instanceof Reflection)) {
            return;
        }

        page.navigation.children.forEach(c => c['toc'] = page.toc);

        // page.toc = new NavigationItem();
        // Theme.buildToc(page.model, page.toc);
        // console.warn(page.navigation);
    }

    /**
     * Create a toc navigation item structure.
     *
     * @param model   The models whose children should be written to the toc.
     * @param parent  The parent [[Models.NavigationItem]] the toc should be appended to.
     */
    static buildToc(model: DeclarationReflection, parent: NavigationItem) {
        const children = model.children || [];
        children.forEach((child: DeclarationReflection) => {
            const item = NavigationItem.create(child, parent, true);
            Theme.buildToc(child, item);
        });
    }
}