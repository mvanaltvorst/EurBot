import Command from './Command';

export default abstract class ContProbDistCommand extends Command {
    abstract pdf(x: number): number;
    abstract cdf(x: number): number;
}