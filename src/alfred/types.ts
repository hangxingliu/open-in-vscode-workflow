/**
 * @see https://www.alfredapp.com/help/workflows/inputs/script-filter/json/
 * @version 2025-01-03 (Alfred 5.5)
 */
export namespace AlfredFilter {
  export type Result = {
    /**
     * **Variables / Session Variables**:
     *
     * Variables within a `variables` object will be passed out of the script filter
     * and remain accessible throughout the current session as environment variables.
     *
     * In addition, they are passed back in when the script reruns within the same session.
     * This can be used for managing state between runs as the user types input or
     * when the script is set to re-run after an interval.
     */
    variables?: Record<string, any>;

    /**
     * Scripts can be set to re-run automatically after an interval using the rerun key with
     * a value from `0.1` to `5.0` seconds.
     *
     * The script will only be re-run if the script filter is still active
     * and the user hasn't changed the state of the filter by typing and triggering a re-run.
     */
    rerun?: number;
    cache?: Cache;

    items: Item[];
  };

  /**
   * Scripts which take a while to return can cache results so users see data sooner
   * on subsequent runs.
   * The Script Filter presents the results from the previous run when caching is active
   * and hasn't expired.
   *
   * Because the script won't execute when loading cached data,
   * we recommend this option only be used with "Alfred filters results".
   */
  export type Cache = {
    /**
     * Time to live for cached data is defined as a number of seconds
     * between `5` and `86400` (i.e. 24 hours).
     */
    seconds: number;

    /**
     * The optional `loosereload` key asks the Script Filter to try to
     * show any cached data first.
     *
     * If it's determined to be stale, the script runs in the background and replaces
     * results with the new data when it becomes available.
     */
    loosereload?: boolean;
  };

  export type Item = {
    /**
     * A unique identifier for the item.
     * It allows Alfred to learn about the item for subsequent sorting and
     * ordering of the user's actioned results.
     */
    uid?: string;
    title: string;
    subtitle: string;

    /**
     * The argument which is passed through the workflow to the connected output action.
     */
    arg?: string | string[];

    /**
     * The optional `type` key alters this behaviour.
     * Setting it to `fileicon` will tell Alfred to get the file icon for the specified path.
     *
     * `filetype` is similar but takes a file UTI (Uniform Type Identifier) as the `path`.
     */
    icon?: { type?: 'fileicon' | 'filetype'; path: string };

    /**
     * If the item is valid or not.
     * If an `item` is valid then Alfred will action it when the user presses return.
     * If the `item` is not valid, Alfred will do nothing.
     *
     * This allows you to intelligently prevent Alfred from actioning a result
     * based on the current `{query}` passed into your script.
     */
    valid?: boolean;

    /**
     * The `match` field enables you to define what
     * Alfred matches against when the workflow is set to "Alfred Filters Results".
     *
     * If `match` is present, it fully replaces matching on the `title` property.
     */
    match?: string;

    /**
     * An optional but recommended string you can provide to populate into
     * Alfred's search field if the user auto-complete's the selected result (⇥ by default).
     */
    autocomplete?: string;

    /**
     * By specifying `"type": "file"`, Alfred treats your result as a file on your system.
     * This allows the user to perform actions on the file like they can with
     * Alfred's standard file filters.
     *
     * When returning files,
     * Alfred will check if they exist before presenting that result to the user.
     * This has a very small performance implication but makes results as predictable as possible.
     * If you would like Alfred to skip this check because you are certain the files
     * you are returning exist, use `"type": "file:skipcheck"`.
     */
    type?: 'default' | 'file' | 'file:skipcheck';

    /**
     * The mod element gives you control over how the modifier keys react.
     * It can alter the looks of a result (e.g. `subtitle`, `icon`) and output a different `arg`
     * or session variables.
     */
    mods?: {
      alt?: Partial<Item>;
      cmd?: Partial<Item>;
      'cmd+alt'?: Partial<Item>;
    };

    /**
     * Defines the text the user will get when copying the selected result row with `⌘C`
     * or displaying large type with `⌘L`.
     */
    text?: {
      /** ⌘C */
      copy?: string;
      /** ⌘L */
      largetype?: string;
    };

    /**
     * A Quick Look URL which will be visible if the user uses the Quick Look feature
     * within Alfred (tapping shift, or `⌘Y`). `quicklookurl` will also accept a file path,
     * both absolute and relative to home using `~/`.
     */
    quicklookurl?: string;

    /**
     * Individual `item` objects can have `variables` which are passed out of
     * the Script Filter object if the associated result item is selected in Alfred's results list.
     *
     * `variables` set within an `item` will override any JSON session variables of the same name.
     */
    variables?: Record<string, any>;

    /**
     * This element defines the Universal Action items used when actioning the result,
     * and overrides the `arg` being used for actioning.
     *
     * The `action` key can take a string or array for simple types,
     * and the content type will automatically be derived by Alfred to file, url, or text.
     * @see https://www.alfredapp.com/help/features/universal-actions/
     */
    action?:
      | string
      | any[]
      | {
          text?: string[];
          url?: string;
          file?: string;
          auto?: string;
        };
  };
}
