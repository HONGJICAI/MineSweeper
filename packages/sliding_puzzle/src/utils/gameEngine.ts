import { GameState, Position } from '../types/game';

export class GameEngine {
  static createBoard(size: number): (number | null)[] {
    const board: (number | null)[] = Array.from({ length: size * size - 1 }, (_, i) => i + 1);
    board.push(null); // 空格位置

    return this.shuffleBoard(board);
  }

  // 创建有序的游戏板（已完成状态）
  static createSolvedBoard(size: number): (number | null)[] {
    const board: (number | null)[] = Array.from({ length: size * size - 1 }, (_, i) => i + 1);
    board.push(null); // 空格位置在最后
    return board;
  }

  static shuffleBoard(board: (number | null)[]): (number | null)[] {
    const shuffled = [...board];
    const size = Math.sqrt(board.length);

    // 使用Fisher-Yates洗牌算法，然后检查可解性
    do {
      // Fisher-Yates洗牌（不包括最后一个空格位置）
      for (let i = shuffled.length - 2; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    } while (!this.isSolvable(shuffled, size));

    return shuffled;
  }

  // 检查拼图是否可解
  static isSolvable(board: (number | null)[], size: number): boolean {
    const inversions = this.countInversions(board);
    const emptyRowFromBottom = size - Math.floor(board.indexOf(null) / size);

    if (size % 2 === 1) {
      // 奇数网格：逆序对数为偶数时可解
      return inversions % 2 === 0;
    } else {
      // 偶数网格：空格在奇数行（从底部计算）且逆序对数为偶数，或空格在偶数行且逆序对数为奇数
      return (emptyRowFromBottom % 2 === 1) === (inversions % 2 === 0);
    }
  }

  // 计算逆序对数量（不包括空格）
  static countInversions(board: (number | null)[]): number {
    let inversions = 0;
    const numbers = board.filter(tile => tile !== null) as number[];

    for (let i = 0; i < numbers.length - 1; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        if (numbers[i] > numbers[j]) {
          inversions++;
        }
      }
    }

    return inversions;
  }

  static getPossibleMoves(emptyIndex: number, size: number): number[] {
    const moves: number[] = [];
    const { row, col } = this.indexToPosition(emptyIndex, size);

    // 上
    if (row > 0) moves.push(this.positionToIndex(row - 1, col, size));
    // 下
    if (row < size - 1) moves.push(this.positionToIndex(row + 1, col, size));
    // 左
    if (col > 0) moves.push(this.positionToIndex(row, col - 1, size));
    // 右
    if (col < size - 1) moves.push(this.positionToIndex(row, col + 1, size));

    return moves;
  }

  static canMove(tileIndex: number, emptyIndex: number, size: number): boolean {
    const possibleMoves = this.getPossibleMoves(emptyIndex, size);
    return possibleMoves.includes(tileIndex);
  }

  static moveTile(gameState: GameState, tileIndex: number): GameState {
    if (!this.canMove(tileIndex, gameState.emptyIndex, gameState.size)) {
      return gameState;
    }

    const newBoard = [...gameState.board];
    this.swapTiles(newBoard, gameState.emptyIndex, tileIndex);

    const newState: GameState = {
      ...gameState,
      board: newBoard,
      emptyIndex: tileIndex,
      moves: gameState.moves + 1,
    };

    // 检查是否完成
    if (this.isCompleted(newBoard)) {
      newState.isCompleted = true;
      newState.endTime = Date.now();
    }

    return newState;
  }

  static isCompleted(board: (number | null)[]): boolean {
    for (let i = 0; i < board.length - 1; i++) {
      if (board[i] !== i + 1) {
        return false;
      }
    }
    return board[board.length - 1] === null;
  }

  static swapTiles(board: (number | null)[], index1: number, index2: number): void {
    [board[index1], board[index2]] = [board[index2], board[index1]];
  }

  static indexToPosition(index: number, size: number): Position {
    return {
      row: Math.floor(index / size),
      col: index % size,
    };
  }

  static positionToIndex(row: number, col: number, size: number): number {
    return row * size + col;
  }

  static formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // 计算游戏完成进度（0-100）
  static getCompletionProgress(board: (number | null)[]): number {
    let correctTiles = 0;
    
    for (let i = 0; i < board.length - 1; i++) {
      if (board[i] === i + 1) {
        correctTiles++;
      }
    }
    
    // 检查空格是否在正确位置
    if (board[board.length - 1] === null) {
      correctTiles++;
    }
    
    return Math.round((correctTiles / board.length) * 100);
  }
}