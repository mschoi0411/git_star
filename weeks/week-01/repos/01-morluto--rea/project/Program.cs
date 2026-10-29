using System;

namespace ReaLab
{
    public static class ScoreEngine
    {
        public static int ComputeScore(int input)
        {
            return input * 3 + 7;
        }

        public static string ChooseMessage(int score)
        {
            return score >= 20 ? "analysis-ready" : "analysis-pending";
        }
    }

    public static class Program
    {
        public static void Main()
        {
            int score = ScoreEngine.ComputeScore(5);
            string message = ScoreEngine.ChooseMessage(score);
            Console.WriteLine($"REA_LAB_MARKER:{message}:{score}");
        }
    }
}