#include <stdio.h>

#define EXPORT __declspec(dllexport)
#define NOINLINE __declspec(noinline)

EXPORT NOINLINE int compute_score(int input) {
    return input * 3 + 7;
}

EXPORT NOINLINE const char *choose_message(int score) {
    return score >= 20 ? "analysis-ready" : "analysis-pending";
}

int main(void) {
    int score = compute_score(5);
    const char *message = choose_message(score);

    printf("GHIDRA_LAB_MARKER:%s:%d\n", message, score);
    return score == 22 ? 0 : 1;
}
