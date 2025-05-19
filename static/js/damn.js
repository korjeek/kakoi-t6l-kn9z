class TestCreator {
    constructor() {
        this.testData = {
            title: '',
            traits: {},
            questions: [],
            results: []
        };
    }

    setTitle(title) {
        this.testData.title = title;
    }

    addTrait(name, weight = 1) {
        const id = `trait_${Date.now()}`;
        this.testData.traits[id] = { name, weight };
        return id;
    }

    addQuestion(question) {
        this.testData.questions.push(question);
    }

    addResult(result) {
        this.testData.results.push(result);
    }

    exportJSON() {
        return JSON.stringify(this.testData, (key, value) => {
            if (key === 'condition') return value.toString();
            return value;
        });
    }

    importJSON(json) {
        const data = JSON.parse(json, (key, value) => {
            if (key === 'condition') return new Function('scores', value);
            return value;
        });
        this.testData = data;
    }
}