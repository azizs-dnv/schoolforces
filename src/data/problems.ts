import { Problem } from '../types';
import { computeHash } from '../utils/judge';

export const PROBLEMS: Problem[] = [
  {
    id: 'A',
    number: 1,
    title: 'A + B',
    difficulty: 800,
    tags: ['school', 'arithmetic', 'input-output', '800'],
    timeLimit: '1.0 second',
    memoryLimit: '256 megabytes',
    statement: [
      'You are given two integers, $A$ and $B$. Your task is to calculate their sum and output the result.',
      'This classic introductory problem lets you get familiar with the SchoolForces judging system and check that your input and output are handled correctly.'
    ],
    inputFormat: [
      'The input contains two integers, $A$ and $B$ ($-10^9 \\le A, B \\le 10^9$). They may be given on one line, separated by a space, or on separate lines.'
    ],
    outputFormat: [
      'Output a single integer: the sum $A + B$.'
    ],
    note: [
      'In the first example, $2 + 3 = 5$. In the second example, $-5 + 10 = 5$.'
    ],
    sampleTests: [
      { input: '2 3', output: '5' },
      { input: '-5 10', output: '5' },
      { input: '0 0', output: '0' }
    ],
    hiddenTests: [
      { input: '100000 250000', output: '350000', outputHash: computeHash('350000') },
      { input: '-50 -70', output: '-120', outputHash: computeHash('-120') },
      { input: '999999999 -999999999', output: '0', outputHash: computeHash('0') },
      { input: '123456789 987654321', output: '1111111110', outputHash: computeHash('1111111110') },
      { input: '-1 1', output: '0', outputHash: computeHash('0') }
    ],
    starterCode: {
      cpp: `#include <iostream>
using namespace std;

int main() {
    // TODO: Read two integers and print their sum.
    return 0;
}`,
      python: `# TODO: Read two integers and print their sum.`,
      javascript: `const fs = require('fs');
// TODO: Read two integers and print their sum.`
    }
  },
  {
    id: 'B',
    number: 2,
    title: 'Even or Odd',
    difficulty: 800,
    tags: ['school', 'conditional statements', '800'],
    timeLimit: '1.0 second',
    memoryLimit: '256 megabytes',
    statement: [
      'Young programmer Petya is learning how to test divisibility. Help him write a program that determines whether the given integer $N$ is even or odd.',
      'A number is even if it is divisible by 2 with no remainder, and odd otherwise.'
    ],
    inputFormat: [
      'The input consists of a single integer $N$ ($-10^9 \\le N \\le 10^9$).'
    ],
    outputFormat: [
      'Output "EVEN" (without the quotes) if $N$ is even, or "ODD" if it is odd.'
    ],
    note: [
      'The number 4 is divisible by 2, so the output is EVEN. Dividing 7 by 2 leaves a remainder of 1, so the answer is ODD.'
    ],
    sampleTests: [
      { input: '4', output: 'EVEN' },
      { input: '7', output: 'ODD' },
      { input: '0', output: 'EVEN' }
    ],
    hiddenTests: [
      { input: '-3', output: 'ODD', outputHash: computeHash('ODD') },
      { input: '-8', output: 'EVEN', outputHash: computeHash('EVEN') },
      { input: '1000000000', output: 'EVEN', outputHash: computeHash('EVEN') },
      { input: '999999999', output: 'ODD', outputHash: computeHash('ODD') },
      { input: '-1', output: 'ODD', outputHash: computeHash('ODD') }
    ],
    starterCode: {
      cpp: `#include <iostream>
using namespace std;

int main() {
    // TODO: Read an integer and print whether it is even or odd.
    return 0;
}`,
      python: `# TODO: Read an integer and print whether it is even or odd.`,
      javascript: `const fs = require('fs');
// TODO: Read an integer and print whether it is even or odd.`
    }
  },
  {
    id: 'C',
    number: 3,
    title: 'Find the Maximum of Three Numbers',
    difficulty: 900,
    tags: ['school', 'conditionals', 'mathematics', '900'],
    timeLimit: '1.0 second',
    memoryLimit: '256 megabytes',
    statement: [
      'At an informatics olympiad, the jury has chosen three integers: $A$, $B$, and $C$.',
      'Find the largest of these three numbers as quickly as you can.'
    ],
    inputFormat: [
      'The input contains three space-separated integers, $A$, $B$, and $C$ ($-10^9 \\le A, B, C \\le 10^9$).'
    ],
    outputFormat: [
      'Output a single integer: the largest of the three numbers.'
    ],
    note: [
      'The largest of 3, 7, and 2 is 7.'
    ],
    sampleTests: [
      { input: '3 7 2', output: '7' },
      { input: '-10 -5 -20', output: '-5' },
      { input: '5 5 5', output: '5' }
    ],
    hiddenTests: [
      { input: '100 20 50', output: '100', outputHash: computeHash('100') },
      { input: '15 42 42', output: '42', outputHash: computeHash('42') },
      { input: '-1000 -2000 -500', output: '-500', outputHash: computeHash('-500') },
      { input: '0 0 -1', output: '0', outputHash: computeHash('0') }
    ],
    starterCode: {
      cpp: `#include <iostream>
#include <algorithm>
using namespace std;

int main() {
    // TODO: Read three integers and print the largest.
    return 0;
}`,
      python: `# TODO: Read three integers and print the largest.`,
      javascript: `const fs = require('fs');
// TODO: Read three integers and print the largest.`
    }
  },
  {
    id: 'D',
    number: 4,
    title: 'Reverse a String',
    difficulty: 1000,
    tags: ['school', 'strings', '1000'],
    timeLimit: '1.0 second',
    memoryLimit: '256 megabytes',
    statement: [
      'You are given a string $S$. Output the string in reverse order.',
      'For example, the reverse of "codeforces" is "secrofedoc".'
    ],
    inputFormat: [
      'The input consists of a non-empty string $S$ containing only English letters or digits. The string is at most 1000 characters long.'
    ],
    outputFormat: [
      'Output the reversed string.'
    ],
    note: [
      'Read the entire input string and output its characters in reverse order.'
    ],
    sampleTests: [
      { input: 'hello', output: 'olleh' },
      { input: 'schoolforces', output: 'secrofloohcs' },
      { input: '12345', output: '54321' }
    ],
    hiddenTests: [
      { input: 'a', output: 'a', outputHash: computeHash('a') },
      { input: 'racecar', output: 'racecar', outputHash: computeHash('racecar') },
      { input: 'Python3', output: '3nohtyP', outputHash: computeHash('3nohtyP') },
      { input: 'ABCDEF', output: 'FEDCBA', outputHash: computeHash('FEDCBA') }
    ],
    starterCode: {
      cpp: `#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    // TODO: Read a string and print it in reverse.
    return 0;
}`,
      python: `# TODO: Read a string and print it in reverse.`,
      javascript: `const fs = require('fs');
// TODO: Read a string and print it in reverse.`
    }
  },
  {
    id: 'E',
    number: 5,
    title: 'Factorial',
    difficulty: 1100,
    tags: ['school', 'mathematics', 'loops', '1100'],
    timeLimit: '1.0 second',
    memoryLimit: '256 megabytes',
    statement: [
      'The factorial of a non-negative integer $N$, denoted by $N!$, is the product of all integers from 1 to $N$. By definition, $0! = 1$.',
      'You are given an integer $N$ ($0 \\le N \\le 15$). Calculate $N!$.'
    ],
    inputFormat: [
      'The input contains a single non-negative integer $N$ ($0 \\le N \\le 15$).'
    ],
    outputFormat: [
      'Output the value of $N!$.'
    ],
    note: [
      '$5! = 1 \\times 2 \\times 3 \\times 4 \\times 5 = 120$.'
    ],
    sampleTests: [
      { input: '5', output: '120' },
      { input: '0', output: '1' },
      { input: '3', output: '6' }
    ],
    hiddenTests: [
      { input: '1', output: '1', outputHash: computeHash('1') },
      { input: '4', output: '24', outputHash: computeHash('24') },
      { input: '7', output: '5040', outputHash: computeHash('5040') },
      { input: '10', output: '3628800', outputHash: computeHash('3628800') }
    ],
    starterCode: {
      cpp: `#include <iostream>
using namespace std;

int main() {
    // TODO: Read a number and print its factorial.
    return 0;
}`,
      python: `# TODO: Read a number and print its factorial.`,
      javascript: `const fs = require('fs');
// TODO: Read a number and print its factorial.`
    }
  }
];
