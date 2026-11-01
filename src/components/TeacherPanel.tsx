import React, { useState } from 'react';
import { Problem, User, TestCase, Contest } from '../types';
import { computeHash } from '../utils/judge';
import { TEACHER_TOKEN_KEY, TEACHER_PASSWORD_STORAGE_KEY, DEFAULT_TEACHER_PASSWORD, getTeacherPassword } from './TeacherAuthModal';
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  UserPlus,
  ShieldAlert,
  LogOut,
  CheckCircle2,
  BookOpen,
  Users,
  Code2,
  Clock,
  Cpu,
  KeyRound,
  Lock,
  RefreshCw,
  Trophy,
  Play,
  StopCircle
} from 'lucide-react';

interface TeacherPanelProps {
  problems: Problem[];
  users: User[];
  contests: Contest[];
  onSaveProblem: (problem: Problem) => void;
  onDeleteProblem: (problemId: string) => void;
  onRegisterStudent: (newStudent: User) => boolean;
  onDeleteStudent: (handle: string) => void;
  onSaveContest: (contest: Contest) => void;
  onDeleteContest: (contestId: string) => void;
  onStartContest: (contestId: string) => void;
  onFinishContest: (contestId: string) => void;
  onExitTeacherMode: () => void;
}

export const TeacherPanel: React.FC<TeacherPanelProps> = ({
  problems,
  users,
  contests,
  onSaveProblem,
  onDeleteProblem,
  onRegisterStudent,
  onDeleteStudent,
  onSaveContest,
  onDeleteContest,
  onStartContest,
  onFinishContest,
  onExitTeacherMode
}) => {
  // Verify token
  const token = sessionStorage.getItem(TEACHER_TOKEN_KEY);
  if (!token) {
    return (
      <div className="bg-red-50 border-2 border-red-500 rounded p-6 text-center max-w-lg mx-auto shadow-md">
        <ShieldAlert className="w-10 h-10 text-red-600 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-red-800">Доступ запрещён!</h2>
        <p className="text-xs text-red-700 mt-2">
          У вас нет действующей сессии учителя. Переход по прямым ссылкам заблокирован.
        </p>
        <button
          onClick={onExitTeacherMode}
          className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded text-xs cursor-pointer"
        >
          Вернуться на главную страницу
        </button>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'createProblem' | 'manageProblems' | 'students' | 'manageContests' | 'security'>('createProblem');

  // Contest Form State
  const [contestTitle, setContestTitle] = useState('');
  const [contestDesc, setContestDesc] = useState('');
  const [contestDuration, setContestDuration] = useState<number>(120);
  const [contestSelectedProbs, setContestSelectedProbs] = useState<string[]>(['A', 'B', 'C']);
  const [contestAllowAll, setContestAllowAll] = useState<boolean>(true);
  const [contestSelectedStudents, setContestSelectedStudents] = useState<string[]>([]);

  // Security / Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    const currentMaster = getTeacherPassword();
    if (oldPassword !== currentMaster) {
      setPwdMsg({ text: 'Неверно указан текущий пароль учителя!', isError: true });
      return;
    }
    if (newPassword.length < 4) {
      setPwdMsg({ text: 'Новый пароль должен содержать минимум 4 символа!', isError: true });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwdMsg({ text: 'Новые пароли не совпадают!', isError: true });
      return;
    }
    localStorage.setItem(TEACHER_PASSWORD_STORAGE_KEY, newPassword);
    setOldPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPwdMsg({ text: 'Мастер-пароль учителя успешно изменён и сохранён!', isError: false });
  };

  const handleResetPasswordToDefault = () => {
    if (confirm('Сбросить пароль учителя к стандартному значению "teacher2026"?')) {
      localStorage.removeItem(TEACHER_PASSWORD_STORAGE_KEY);
      setPwdMsg({ text: 'Пароль сброшен к стандартному "teacher2026".', isError: false });
    }
  };

  // Problem Form State
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [problemId, setProblemId] = useState<string>('F');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<number>(800);
  const [tags, setTags] = useState('школьные, базовая логика');
  const [timeLimit, setTimeLimit] = useState('1.0 секунда');
  const [memoryLimit, setMemoryLimit] = useState('256 мегабайт');
  const [statement, setStatement] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');

  // Dynamic test builder state
  const [testCases, setTestCases] = useState<Array<{ input: string; output: string; isSample: boolean }>>([
    { input: '', output: '', isSample: true },
    { input: '', output: '', isSample: false }
  ]);

  // Student Registration Form State
  const [newStudentHandle, setNewStudentHandle] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentRating, setNewStudentRating] = useState<number>(1200);
  const [newStudentContests, setNewStudentContests] = useState<string[]>(['*']);
  const [studentError, setStudentError] = useState('');
  const [studentSuccess, setStudentSuccess] = useState('');

  const handleCreateContestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestTitle.trim()) {
      alert('Укажите название олимпиады!');
      return;
    }
    if (contestSelectedProbs.length === 0) {
      alert('Выберите хотя бы одну задачу для олимпиады!');
      return;
    }

    const newContestId = 'contest-' + Date.now().toString(36);
    const newContest: Contest = {
      id: newContestId,
      title: contestTitle.trim(),
      description: contestDesc.trim() || 'Школьное соревнование по программированию',
      durationMinutes: Number(contestDuration) || 120,
      status: 'upcoming',
      problemIds: contestSelectedProbs,
      allowedStudents: contestAllowAll ? ['*'] : contestSelectedStudents,
      hideCodeDuringContest: true,
      author: 'Учитель информатики'
    };

    onSaveContest(newContest);
    alert(`Олимпиада "${contestTitle.trim()}" успешно создана! Вы можете запустить её в любое время.`);
    setContestTitle('');
    setContestDesc('');
    setContestDuration(120);
    setContestSelectedProbs(['A', 'B']);
    setContestAllowAll(true);
  };

  const handleAddTestCase = () => {
    setTestCases(prev => [...prev, { input: '', output: '', isSample: false }]);
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases.length <= 1) {
      alert('В задаче должен быть хотя бы один тест!');
      return;
    }
    setTestCases(prev => prev.filter((_, i) => i !== index));
  };

  const handleTestCaseChange = (index: number, field: 'input' | 'output' | 'isSample', value: any) => {
    setTestCases(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleStartEdit = (prob: Problem) => {
    setEditingProblemId(prob.id);
    setProblemId(prob.id);
    setTitle(prob.title);
    setDifficulty(prob.difficulty);
    setTags(prob.tags.join(', '));
    setTimeLimit(prob.timeLimit);
    setMemoryLimit(prob.memoryLimit);
    setStatement(prob.statement.join('\n\n'));
    setInputFormat(prob.inputFormat.join('\n\n'));
    setOutputFormat(prob.outputFormat.join('\n\n'));

    const combinedTests: Array<{ input: string; output: string; isSample: boolean }> = [];
    prob.sampleTests.forEach(t => combinedTests.push({ input: t.input, output: t.output, isSample: true }));
    prob.hiddenTests.forEach(t => combinedTests.push({ input: t.input, output: t.output, isSample: false }));
    setTestCases(combinedTests.length > 0 ? combinedTests : [{ input: '', output: '', isSample: true }]);
    setActiveTab('createProblem');
  };

  const handleResetForm = () => {
    setEditingProblemId(null);
    setProblemId(String.fromCharCode(65 + problems.length)); // Next letter
    setTitle('');
    setDifficulty(800);
    setTags('школьные');
    setTimeLimit('1.0 секунда');
    setMemoryLimit('256 мегабайт');
    setStatement('');
    setInputFormat('');
    setOutputFormat('');
    setTestCases([
      { input: '', output: '', isSample: true },
      { input: '', output: '', isSample: false }
    ]);
  };

  const handlePublishProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Укажите название задачи!');
      return;
    }

    if (testCases.some(t => !t.input.trim() || !t.output.trim())) {
      alert('Все добавленные тесты должны содержать непустые входные данные и ожидаемый ответ!');
      return;
    }

    const sampleTests: TestCase[] = testCases
      .filter(t => t.isSample)
      .map(t => ({ input: t.input.trim(), output: t.output.trim(), isSample: true }));

    const hiddenTests: TestCase[] = testCases
      .filter(t => !t.isSample)
      .map(t => ({
        input: t.input.trim(),
        output: t.output.trim(),
        isSample: false,
        outputHash: computeHash(t.output.trim())
      }));

    if (sampleTests.length === 0) {
      alert('Укажите хотя бы один тест как пример (Sample)!');
      return;
    }

    const newProblem: Problem = {
      id: editingProblemId || problemId.toUpperCase().trim(),
      number: editingProblemId
        ? problems.find(p => p.id === editingProblemId)?.number || problems.length + 1
        : problems.length + 1,
      title: title.trim(),
      difficulty: Number(difficulty),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      timeLimit,
      memoryLimit,
      statement: statement.split('\n\n').filter(Boolean),
      inputFormat: inputFormat.split('\n\n').filter(Boolean),
      outputFormat: outputFormat.split('\n\n').filter(Boolean),
      sampleTests,
      hiddenTests: hiddenTests.length > 0 ? hiddenTests : sampleTests,
      starterCode: {
        cpp: `#include <iostream>
using namespace std;

int main() {
    // Решение задачи "${title.trim()}"
    return 0;
}`,
        python: `# Решение задачи "${title.trim()}"
`,
        javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
`
      },
      author: 'Учитель информатики',
      createdAt: new Date().toISOString().split('T')[0]
    };

    onSaveProblem(newProblem);
    alert(editingProblemId ? 'Задача успешно обновлена!' : 'Задача успешно опубликована для всех учеников!');
    handleResetForm();
    setActiveTab('manageProblems');
  };

  const handleRegisterStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');
    setStudentSuccess('');

    const cleanHandle = newStudentHandle.trim();
    if (!cleanHandle) {
      setStudentError('Введите логин ученика');
      return;
    }
    if (newStudentPassword.length < 3) {
      setStudentError('Пароль должен быть не менее 3 символов');
      return;
    }

    const newStudent: User = {
      handle: cleanHandle,
      password: newStudentPassword,
      rating: Number(newStudentRating) || 1200,
      maxRating: Number(newStudentRating) || 1200,
      solvedProblems: [],
      registeredAt: new Date().toISOString().split('T')[0],
      submissionsCount: 0,
      allowedContests: newStudentContests
    };

    const ok = onRegisterStudent(newStudent);
    if (ok) {
      setStudentSuccess(`Ученик "${cleanHandle}" успешно зарегистрирован! Пароль: "${newStudentPassword}"`);
      setNewStudentHandle('');
      setNewStudentPassword('');
      setNewStudentRating(1200);
    } else {
      setStudentError('Пользователь с таким никнеймом уже зарегистрирован!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-red-800 text-white border border-red-900 rounded p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-300" />
          <div>
            <h1 className="font-bold text-sm tracking-wide uppercase">
              Панель управления учителя (Защищённый режим)
            </h1>
            <p className="text-[11px] text-red-200">
              Создание задач, динамический конструктор тестов и централизованная регистрация учеников
            </p>
          </div>
        </div>

        <button
          onClick={onExitTeacherMode}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900 hover:bg-red-950 text-white rounded text-xs font-semibold transition border border-red-700 cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Выйти из учительской</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-300 bg-white rounded-t overflow-hidden text-xs font-bold">
        <button
          onClick={() => setActiveTab('createProblem')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 cursor-pointer transition ${
            activeTab === 'createProblem'
              ? 'border-red-700 text-red-700 bg-red-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{editingProblemId ? 'Редактировать задачу' : 'Конструктор новой задачи'}</span>
        </button>

        <button
          onClick={() => setActiveTab('manageProblems')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 cursor-pointer transition ${
            activeTab === 'manageProblems'
              ? 'border-red-700 text-red-700 bg-red-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Все задачи ({problems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 cursor-pointer transition ${
            activeTab === 'students'
              ? 'border-red-700 text-red-700 bg-red-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Регистрация и ученики ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('manageContests')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 cursor-pointer transition ${
            activeTab === 'manageContests'
              ? 'border-red-700 text-red-700 bg-red-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Олимпиады / Контесты ({contests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 cursor-pointer transition ${
            activeTab === 'security'
              ? 'border-red-700 text-red-700 bg-red-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Смена пароля учителя</span>
        </button>
      </div>

      {/* TAB 1: Конструктор задачи */}
      {activeTab === 'createProblem' && (
        <form onSubmit={handlePublishProblem} className="bg-white border border-[#b9c0c7] rounded p-6 shadow-2xs space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase">
              {editingProblemId ? `Редактирование задачи ${editingProblemId}` : 'Создание олимпиадной задачи'}
            </h2>
            {editingProblemId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs text-blue-700 hover:underline cursor-pointer"
              >
                Отменить редактирование
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Буква / ID задачи:</label>
              <input
                type="text"
                required
                maxLength={4}
                value={problemId}
                onChange={e => setProblemId(e.target.value.toUpperCase())}
                className="w-full p-2 border border-slate-300 rounded uppercase font-bold text-slate-800"
                placeholder="F"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Название задачи:</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800"
                placeholder="например: Простые делители числа"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Сложность (Рейтинг):</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded font-bold text-slate-800 bg-white"
              >
                <option value={800}>*800 (Базовый)</option>
                <option value={900}>*900</option>
                <option value={1000}>*1000</option>
                <option value={1100}>*1100</option>
                <option value={1200}>*1200</option>
                <option value={1300}>*1300</option>
                <option value={1400}>*1400</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Теги через запятую:</label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded"
                placeholder="строки, математика, 900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ограничение времени:</label>
              <input
                type="text"
                value={timeLimit}
                onChange={e => setTimeLimit(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ограничение памяти:</label>
              <input
                type="text"
                value={memoryLimit}
                onChange={e => setMemoryLimit(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Условие задачи (текст):</label>
            <textarea
              required
              rows={4}
              value={statement}
              onChange={e => setStatement(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded font-sans leading-relaxed"
              placeholder="Опишите легенду и требование задачи..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Формат входных данных:</label>
              <textarea
                required
                rows={2}
                value={inputFormat}
                onChange={e => setInputFormat(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded"
                placeholder="В первой строке задано целое число N..."
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Формат выходных данных:</label>
              <textarea
                required
                rows={2}
                value={outputFormat}
                onChange={e => setOutputFormat(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded"
                placeholder="Выведите ответ на задачу..."
              />
            </div>
          </div>

          {/* Dynamic Test Constructor */}
          <div className="border border-slate-300 rounded p-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 uppercase tracking-wide">
                  Конструктор тестов для автоматического чекера
                </h3>
                <p className="text-[11px] text-slate-500">
                  Добавьте тесты для проверки. Скрытые тесты автоматически защищаются хэшем и скрыты от учеников в F12.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTestCase}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold cursor-pointer transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Добавить тест</span>
              </button>
            </div>

            <div className="space-y-3">
              {testCases.map((tc, idx) => (
                <div key={idx} className="p-3 bg-white border border-slate-200 rounded shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Тест #{idx + 1}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-600">
                        <input
                          type="checkbox"
                          checked={tc.isSample}
                          onChange={e => handleTestCaseChange(idx, 'isSample', e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>Показывать в условии (Пример)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveTestCase(idx)}
                        className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                        title="Удалить тест"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        Входные данные (stdin):
                      </span>
                      <textarea
                        rows={2}
                        required
                        value={tc.input}
                        onChange={e => handleTestCaseChange(idx, 'input', e.target.value)}
                        className="w-full font-mono text-xs p-2 border border-slate-300 rounded bg-slate-50"
                        placeholder="Например: 5 10"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        Ожидаемый ответ (stdout):
                      </span>
                      <textarea
                        rows={2}
                        required
                        value={tc.output}
                        onChange={e => handleTestCaseChange(idx, 'output', e.target.value)}
                        className="w-full font-mono text-xs p-2 border border-slate-300 rounded bg-slate-50"
                        placeholder="Например: 15"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-sm tracking-wide transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{editingProblemId ? 'Сохранить изменения' : 'Опубликовать задачу для учеников'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Управление всеми задачами */}
      {activeTab === 'manageProblems' && (
        <div className="bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs">
          <div className="bg-[#e1e7ee] px-4 py-2.5 border-b border-[#b9c0c7] flex items-center justify-between">
            <span className="font-bold text-xs uppercase text-slate-800">
              Список всех опубликованных задач ({problems.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                  <th className="py-2.5 px-3 text-center w-12">#</th>
                  <th className="py-2.5 px-4">Название</th>
                  <th className="py-2.5 px-3 text-center">Сложность</th>
                  <th className="py-2.5 px-3 text-center">Тестов</th>
                  <th className="py-2.5 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {problems.map(prob => (
                  <tr key={prob.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 text-center font-mono font-bold">{prob.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{prob.title}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 rounded font-mono font-bold">
                        *{prob.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {prob.sampleTests.length + prob.hiddenTests.length}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleStartEdit(prob)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded font-semibold transition cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Изменить</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Удалить задачу "${prob.id}. ${prob.title}"?`)) {
                            onDeleteProblem(prob.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded font-semibold transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Удалить</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Регистрация учеников учителем */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Регистрация нового ученика */}
          <div className="bg-white border border-[#b9c0c7] rounded p-5 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <UserPlus className="w-4 h-4 text-emerald-700" />
              <h2 className="font-bold text-slate-800 uppercase">Регистрация нового ученика</h2>
            </div>

            <p className="text-slate-500 leading-relaxed">
              Самостоятельная регистрация учеников на платформе отключена в целях безопасности. Выдайте логин и пароль ученику для входа.
            </p>

            {studentError && (
              <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded font-semibold">
                {studentError}
              </div>
            )}

            {studentSuccess && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded font-semibold">
                {studentSuccess}
              </div>
            )}

            <form onSubmit={handleRegisterStudentSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Никнейм (Handle):</label>
                <input
                  type="text"
                  required
                  placeholder="например: misha_school"
                  value={newStudentHandle}
                  onChange={e => setNewStudentHandle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Пароль для ученика:</label>
                <input
                  type="text"
                  required
                  placeholder="пароль (например: school123)"
                  value={newStudentPassword}
                  onChange={e => setNewStudentPassword(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Начальный рейтинг:</label>
                <input
                  type="number"
                  required
                  value={newStudentRating}
                  onChange={e => setNewStudentRating(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Доступ к олимпиадам:</label>
                <div className="space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded">
                  <label className="flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newStudentContests.includes('*')}
                      onChange={e => {
                        if (e.target.checked) setNewStudentContests(['*']);
                        else setNewStudentContests([]);
                      }}
                    />
                    <span>Доступ ко всем олимпиадам (*)</span>
                  </label>
                  {!newStudentContests.includes('*') && (
                    <div className="pl-4 space-y-1 pt-1 border-t border-slate-200">
                      {contests.map(c => (
                        <label key={c.id} className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                          <input
                            type="checkbox"
                            checked={newStudentContests.includes(c.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setNewStudentContests(prev => [...prev.filter(x => x !== '*'), c.id]);
                              } else {
                                setNewStudentContests(prev => prev.filter(x => x !== c.id));
                              }
                            }}
                          />
                          <span>{c.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Зарегистрировать ученика</span>
              </button>
            </form>
          </div>

          {/* Список учеников */}
          <div className="lg:col-span-2 bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs">
            <div className="bg-[#e1e7ee] px-4 py-2.5 border-b border-[#b9c0c7] flex items-center justify-between text-xs">
              <span className="font-bold uppercase text-slate-800">
                Зарегистрированные ученики ({users.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                    <th className="py-2.5 px-3">Ученик (Handle)</th>
                    <th className="py-2.5 px-3">Пароль</th>
                    <th className="py-2.5 px-3 text-center">Рейтинг</th>
                    <th className="py-2.5 px-3 text-center">Допуск к контестам</th>
                    <th className="py-2.5 px-3 text-center">Решено</th>
                    <th className="py-2.5 px-3 text-right">Удалить</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map(u => (
                    <tr key={u.handle} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{u.handle}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{u.password}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                        {u.rating}
                      </td>
                      <td className="py-2.5 px-3 text-center text-[10px] text-slate-600">
                        {(!u.allowedContests || u.allowedContests.includes('*')) ? (
                          <span className="text-emerald-700 font-bold">Все (*)</span>
                        ) : (
                          <span>{u.allowedContests.length} контест(ов)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">
                        {u.solvedProblems.length}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Удалить аккаунт ученика ${u.handle}?`)) {
                              onDeleteStudent(u.handle);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-700 transition cursor-pointer"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Управление олимпиадами / контестами */}
      {activeTab === 'manageContests' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          {/* Форма создания контеста */}
          <div className="bg-white border border-[#b9c0c7] rounded p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <Trophy className="w-4 h-4 text-amber-600" />
              <h2 className="font-bold text-slate-800 uppercase">Создать олимпиаду / Контест</h2>
            </div>

            <form onSubmit={handleCreateContestSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Название олимпиады:</label>
                <input
                  type="text"
                  required
                  placeholder="например: Школьный этап ВсОШ 2026"
                  value={contestTitle}
                  onChange={e => setContestTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Краткое описание:</label>
                <textarea
                  rows={2}
                  placeholder="Правила, участники, регламент..."
                  value={contestDesc}
                  onChange={e => setContestDesc(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Длительность (в минутах):</label>
                <input
                  type="number"
                  required
                  min={5}
                  max={600}
                  value={contestDuration}
                  onChange={e => setContestDuration(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Задачи олимпиады:</label>
                <div className="max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded space-y-1">
                  {problems.map(p => (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={contestSelectedProbs.includes(p.id)}
                        onChange={e => {
                          if (e.target.checked) setContestSelectedProbs(prev => [...prev, p.id]);
                          else setContestSelectedProbs(prev => prev.filter(x => x !== p.id));
                        }}
                      />
                      <span>
                        <b>{p.id}.</b> {p.title} (*{p.difficulty})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Допуск участников:</label>
                <div className="space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded">
                  <label className="flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contestAllowAll}
                      onChange={e => setContestAllowAll(e.target.checked)}
                    />
                    <span>Разрешить всем зарегистрированным ученикам</span>
                  </label>

                  {!contestAllowAll && (
                    <div className="max-h-28 overflow-y-auto pl-4 space-y-1 pt-1 border-t border-slate-200">
                      {users.map(u => (
                        <label key={u.handle} className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                          <input
                            type="checkbox"
                            checked={contestSelectedStudents.includes(u.handle)}
                            onChange={e => {
                              if (e.target.checked) {
                                setContestSelectedStudents(prev => [...prev, u.handle]);
                              } else {
                                setContestSelectedStudents(prev => prev.filter(x => x !== u.handle));
                              }
                            }}
                          />
                          <span>{u.handle}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Создать олимпиаду</span>
              </button>
            </form>
          </div>

          {/* Список олимпиад */}
          <div className="lg:col-span-2 bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs">
            <div className="bg-[#e1e7ee] px-4 py-2.5 border-b border-[#b9c0c7] flex items-center justify-between text-xs">
              <span className="font-bold uppercase text-slate-800">
                Созданные олимпиады и контесты ({contests.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                    <th className="py-2.5 px-3">Олимпиада</th>
                    <th className="py-2.5 px-3 text-center">Статус</th>
                    <th className="py-2.5 px-3 text-center">Длительность</th>
                    <th className="py-2.5 px-3 text-center">Задач</th>
                    <th className="py-2.5 px-3 text-right">Управление</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {contests.map(c => {
                    const isRunning = c.status === 'running';
                    const isUpcoming = c.status === 'upcoming';

                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800">{c.title}</div>
                          <div className="text-[11px] text-slate-400">{c.description}</div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {isRunning ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold">
                              🟢 Идёт сейчас
                            </span>
                          ) : isUpcoming ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded font-bold">
                              🟡 Ожидает старта
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-300 rounded">
                              ⚪ Завершён
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center font-mono text-slate-600">
                          {c.durationMinutes} мин
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                          {c.problemIds.length}
                        </td>

                        <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                          {isUpcoming && (
                            <button
                              onClick={() => {
                                if (confirm(`Запустить соревнование "${c.title}" прямо сейчас?`)) {
                                  onStartContest(c.id);
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                              title="Запустить олимпиаду"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span>Старт</span>
                            </button>
                          )}

                          {isRunning && (
                            <button
                              onClick={() => {
                                if (confirm(`Завершить соревнование "${c.title}" досрочно?`)) {
                                  onFinishContest(c.id);
                                }
                              }}
                              className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                              title="Завершить олимпиаду"
                            >
                              <StopCircle className="w-3 h-3" />
                              <span>Стоп</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(`Удалить олимпиаду "${c.title}"?`)) {
                                onDeleteContest(c.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-700 transition cursor-pointer inline-block"
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Смена мастер-пароля учителя */}
      {activeTab === 'security' && (
        <div className="max-w-md mx-auto bg-white border border-[#b9c0c7] rounded p-6 shadow-2xs space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <KeyRound className="w-5 h-5 text-red-700" />
            <div>
              <h2 className="font-bold text-slate-800 uppercase">Безопасность и смена пароля учителя</h2>
              <p className="text-[11px] text-slate-500">
                Новый мастер-пароль будет сохранён в локальном хранилище браузера
              </p>
            </div>
          </div>

          {pwdMsg && (
            <div
              className={`p-2.5 rounded font-semibold text-xs ${
                pwdMsg.isError
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}
            >
              {pwdMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Текущий мастер-пароль:
              </label>
              <input
                type="password"
                required
                placeholder="текущий пароль (по умолчанию: teacher2026)"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Новый мастер-пароль (не менее 4 символов):
              </label>
              <input
                type="password"
                required
                placeholder="новый секретный пароль"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Повторите новый пароль:
              </label>
              <input
                type="password"
                required
                placeholder="повтор нового пароля"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-bold rounded transition cursor-pointer shadow-2xs"
            >
              Сохранить новый пароль
            </button>
          </form>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Забыли или хотите вернуть?</span>
            <button
              type="button"
              onClick={handleResetPasswordToDefault}
              className="text-[11px] text-slate-600 hover:text-red-700 underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Сбросить к teacher2026</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
