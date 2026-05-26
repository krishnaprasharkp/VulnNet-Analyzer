#include "Dashboard.h"
#include <iostream>

int main() {
    // Enable ANSI colors on Windows 10+
#ifdef _WIN32
    // Set console to UTF-8 and enable virtual terminal processing
    system("chcp 65001 > nul");
    system(""); // triggers VT100 mode on Windows 10+
#endif

    Dashboard dashboard;
    dashboard.run();
    return 0;
}
