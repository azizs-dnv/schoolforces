import { Problem } from '../types';
import { computeHash } from '../utils/judge';

export const PROBLEMS: Problem[] = [
  {
    id: 'A',
    number: 1,
    title: 'Сложение A + B',
    difficulty: 800,
    tags: ['школьные', 'арифметика', 'ввод-вывод', '800'],
    timeLimit: '1.0 секунда',
    memoryLimit: '256 мегабайт',
    statement: [
      'Вам даны два целых числа $A$ и $B$. Ваша задача — вычислить их сумму и вывести полученный результат.',
      'Это классическая стартовая задача, позволяющая познакомиться с тестирующей системой SchoolForces и проверить правильность ввода и вывода данных.'
    ],
    inputFormat: [
      'Во входном потоке заданы два целых числа $A$ и $B$ ($-10^9 \\le A, B \\le 10^9$). Числа могут быть записаны в одной строке через пробел либо на разных строках.'
    ],
    outputFormat: [
      'Выведите единственное целое число — сумму $A + B$.'
    ],
    note: [
      'В первом примере $2 + 3 = 5$. Во втором примере $-5 + 10 = 5$.'
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
    long long a, b;
    if (cin >> a >> b) {
        cout << a + b << endl;
    }
    return 0;
}`,
      python: `# Считываем два числа и выводим сумму
a, b = map(int, input().split())
print(a + b)`,
      javascript: `const fs = require('fs');
const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);

if (tokens.length >= 2) {
  const a = parseInt(tokens[0], 10);
  const b = parseInt(tokens[1], 10);
  console.log(a + b);
}`
    }
  },
  {
    id: 'B',
    number: 2,
    title: 'Чётное или нечётное',
    difficulty: 800,
    tags: ['школьные', 'условный оператор', '800'],
    timeLimit: '1.0 секунда',
    memoryLimit: '256 мегабайт',
    statement: [
      'Юный программист Петя учится проверять числа на делимость. Помогите Пете написать программу, которая определяет чётность заданного целого числа $N$.',
      'Число считается чётным, если оно делится на 2 без остатка, и нечётным в противном случае.'
    ],
    inputFormat: [
      'В единственной строке входных данных записано одно целое число $N$ ($-10^9 \\le N \\le 10^9$).'
    ],
    outputFormat: [
      'Выведите строку "EVEN" (без кавычек), если число $N$ чётное, или строку "ODD", если число нечётное.'
    ],
    note: [
      'Число 4 делится на 2, поэтому вывод — EVEN. Число 7 даёт остаток 1 при делении на 2, поэтому ответ ODD.'
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
    long long n;
    cin >> n;
    if (n % 2 == 0) {
        cout << "EVEN" << endl;
    } else {
        cout << "ODD" << endl;
    }
    return 0;
}`,
      python: `n = int(input().strip())
if n % 2 == 0:
    print("EVEN")
else:
    print("ODD")`,
      javascript: `const fs = require('fs');
const n = parseInt(fs.readFileSync(0, 'utf-8').trim(), 10);

if (n % 2 === 0) {
  console.log("EVEN");
} else {
  console.log("ODD");
}`
    }
  },
  {
    id: 'C',
    number: 3,
    title: 'Поиск максимума из трёх чисел',
    difficulty: 900,
    tags: ['школьные', 'условия', 'математика', '900'],
    timeLimit: '1.0 секунда',
    memoryLimit: '256 мегабайт',
    statement: [
      'На олимпиаде по информатике жюри загадало три целых числа: $A$, $B$ и $C$.',
      'Школьнику необходимо как можно быстрее найти наибольшее среди этих трёх чисел.'
    ],
    inputFormat: [
      'Во входных данных записаны три целых числа $A, B, C$ ($-10^9 \\le A, B, C \\le 10^9$), разделённые пробелами.'
    ],
    outputFormat: [
      'Выведите одно целое число — максимальное из заданных трёх чисел.'
    ],
    note: [
      'Среди чисел 3, 7, 2 максимальным является 7.'
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
    long long a, b, c;
    cin >> a >> b >> c;
    cout << max({a, b, c}) << endl;
    return 0;
}`,
      python: `a, b, c = map(int, input().split())
print(max(a, b, c))`,
      javascript: `const fs = require('fs');
const nums = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);
console.log(Math.max(...nums));`
    }
  },
  {
    id: 'D',
    number: 4,
    title: 'Переворот строки',
    difficulty: 1000,
    tags: ['школьные', 'строки', '1000'],
    timeLimit: '1.0 секунда',
    memoryLimit: '256 мегабайт',
    statement: [
      'Вам дана строка $S$. Требуется вывести эту строку задом наперёд (в обратном порядке символов).',
      'Например, для строки "codeforces" ответом будет "secrofedoc".'
    ],
    inputFormat: [
      'В единственной строке записана непустая строка $S$, состоящая из букв латинского алфавита или цифр. Длина строки не превышает 1000 символов.'
    ],
    outputFormat: [
      'Выведите перевёрнутую строку.'
    ],
    note: [
      'Входная строка читается целиком и символы выводятся в обратном порядке.'
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
    string s;
    cin >> s;
    reverse(s.begin(), s.end());
    cout << s << endl;
    return 0;
}`,
      python: `s = input().strip()
print(s[::-1])`,
      javascript: `const fs = require('fs');
const s = fs.readFileSync(0, 'utf-8').trim();
console.log(s.split('').reverse().join(''));`
    }
  },
  {
    id: 'E',
    number: 5,
    title: 'Факториал числа',
    difficulty: 1100,
    tags: ['школьные', 'математика', 'циклы', '1100'],
    timeLimit: '1.0 секунда',
    memoryLimit: '256 мегабайт',
    statement: [
      'Факториалом натурального числа $N$ (обозначается как $N!$) называется произведение всех натуральных чисел от 1 до $N$. По определению, $0! = 1$.',
      'Дано целое число $N$ ($0 \\le N \\le 15$). Вычислите $N!$.'
    ],
    inputFormat: [
      'На вход подаётся одно целое неотрицательное число $N$ ($0 \\le N \\le 15$).'
    ],
    outputFormat: [
      'Выведите значение $N!$.'
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
    int n;
    cin >> n;
    long long fact = 1;
    for (int i = 2; i <= n; i++) {
        fact *= i;
    }
    cout << fact << endl;
    return 0;
}`,
      python: `n = int(input().strip())
res = 1
for i in range(1, n + 1):
    res *= i
print(res)`,
      javascript: `const fs = require('fs');
const n = parseInt(fs.readFileSync(0, 'utf-8').trim(), 10);

let fact = 1;
for (let i = 2; i <= n; i++) {
  fact *= i;
}
console.log(fact);`
    }
  }
];
