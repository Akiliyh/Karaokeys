export const resultsManager = (() => {
    let results = [];

    return {
        getResults: () => results,
        setResults: (newResults) => {
            results = newResults;
            console.log("Results updated:", results);
        },
        addResult: (result) => {
            results.push(result);
            console.log("Result added:", result);
        },
    };
})();