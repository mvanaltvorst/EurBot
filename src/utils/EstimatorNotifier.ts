import { EstimatorArticle } from './Types';

const ESTIMATOR_TIMEOUT = 30*60*1000; // 30 minutes in milliseconds

export default class EstimatorNotifier {
    constructor() {

    }
    async pollNewArticle(): Promise<EstimatorArticle> {
        return {
            title: "asdf",
            slug: "asdf",
            date: new Date()
        };
    }
}