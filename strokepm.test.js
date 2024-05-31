const strokepm = require('./strokepm')

test('error: invalid loop start', () => {
    expect(() => strokepm('/')).toThrow()
    expect(() => strokepm('/ |')).toThrow()
    expect(() => strokepm('/ \\')).toThrow()
    expect(() => strokepm('| / \\')).toThrow()
    expect(() => strokepm('/ / \\')).toThrow()
})

test('error: invalid loop end', () => {
    expect(() => strokepm('\\')).toThrow()
    expect(() => strokepm('/ | \\ \\')).toThrow()
})

test('error: invalid increment', () => {
    expect(() => strokepm('+')).toThrow()
    expect(() => strokepm('+ +')).toThrow()
    expect(() => strokepm('| +')).toThrow()
    expect(() => strokepm('+ | |')).toThrow()
    expect(() => strokepm('+ | +')).toThrow()
    expect(() => strokepm('+ + |')).toThrow()
})

test('error: invalid decrement', () => {
    expect(() => strokepm('-')).toThrow()
    expect(() => strokepm('- -')).toThrow()
    expect(() => strokepm('| -')).toThrow()
    expect(() => strokepm('- | |')).toThrow()
    expect(() => strokepm('- | -')).toThrow()
    expect(() => strokepm('- - |')).toThrow()
})

test('error: invalid variable', () => {
    expect(() => strokepm('|')).toThrow()
    expect(() => strokepm('||')).toThrow()
    expect(() => strokepm('| |')).toThrow()
    expect(() => strokepm('| ||')).toThrow()
    expect(() => strokepm('|| |')).toThrow()
    expect(() => strokepm('|| ||')).toThrow()
})

test('increment', () => {
    expect(strokepm('+ |')).toStrictEqual([1])
    expect(strokepm('+ ||')).toStrictEqual([0, 1])
    expect(strokepm('+ | + ||')).toStrictEqual([1, 1])
    expect(strokepm('+ || + |')).toStrictEqual([1, 1])
    expect(strokepm('+ | + |')).toStrictEqual([2])
    expect(strokepm('+ || + ||')).toStrictEqual([0, 2])
    expect(strokepm('+ | + | + || + || ')).toStrictEqual([2, 2])
    expect(strokepm('+ || + | + || + |')).toStrictEqual([2, 2])
    expect(strokepm('+ |', [42, 13])).toStrictEqual([43, 13])
    expect(strokepm('+ ||', [42, 13])).toStrictEqual([42, 14])
})

test('decrement', () => {
    expect(strokepm('- |')).toStrictEqual([])
    expect(strokepm('- ||')).toStrictEqual([])
    expect(strokepm('+ | + | - |')).toStrictEqual([1])
    expect(strokepm('+ || + || - ||')).toStrictEqual([0, 1])
    expect(strokepm('+ | + || - | - ||')).toStrictEqual([])
    expect(strokepm('+ || + | + || - | + | + | - ||')).toStrictEqual([2, 1])
    expect(strokepm('- |', [42, 13])).toStrictEqual([41, 13])
    expect(strokepm('- ||', [42, 13])).toStrictEqual([42, 12])
})

test('infinite loop', () => {
    expect(() => strokepm('+ | / | \\')).toThrow()
})

test('empty', () => {
    expect(strokepm('')).toStrictEqual([])
})

test('simple', () => {
    expect(strokepm(`
    + | 
    / | 
      - | 
      + || 
    \\
    + |||
  `)).toStrictEqual([0, 1, 1])
  expect(strokepm(`+|/|-|+||\\+|||`)).toStrictEqual([0, 1, 1])
})

test('MOV 0 1', () => {
    const mov = `
    / |
      - |     dec 0
      + ||    inc 1
    \\
    `
    expect(strokepm(mov)).toStrictEqual([])
    expect(strokepm(mov, [1])).toStrictEqual([0, 1])
    expect(strokepm(mov, [42])).toStrictEqual([0, 42])
})

test('CPY 0 1', () => {
    const cpy = `
    / |
      - |     dec 0
      + ||    inc 1
      + |||   inc 2
    \\
    / |||
      - |||   dec 2
      + |     inc 0
    \\
    `
    expect(strokepm(cpy)).toStrictEqual([])
    expect(strokepm(cpy, [1])).toStrictEqual([1, 1])
    expect(strokepm(cpy, [42])).toStrictEqual([42, 42])
})

test('CLR 0', () => {
    const clr = `
    / |
      - |
    \\
    `
    expect(strokepm(clr, [0])).toStrictEqual([])
    expect(strokepm(clr, [1])).toStrictEqual([])
    expect(strokepm(clr, [42])).toStrictEqual([])
    expect(strokepm(clr, [42, 13])).toStrictEqual([0, 13])
})

test('ADD 0 1', () => {
    const add = `
    / ||
      - ||
      + |
    \\
    `
    expect(strokepm(add)).toStrictEqual([])
    expect(strokepm(add, [1])).toStrictEqual([1])
    expect(strokepm(add, [0, 1])).toStrictEqual([1])
    expect(strokepm(add, [1, 1])).toStrictEqual([2])
    expect(strokepm(add, [42, 13])).toStrictEqual([55])
})

test('IF 0 => 1', () => {
    const sel = `
    / |
      - |     dec 0
      + |||   inc 2
      + ||||  inc 3
    \\
    / ||||
      - ||||  dec 3
      + |     inc 0
    \\
    / ||| 
      / ||| - ||| \\ clr aux 2

      + ||    inc 1  conditionally
    \\
    `
    expect(strokepm(sel)).toStrictEqual([])
    expect(strokepm(sel, [1])).toStrictEqual([1, 1])
    expect(strokepm(sel, [42])).toStrictEqual([42, 1])
})

test('FIB', () => {
    const fib = `
    + |||||
    / |||||    forever   

      !   output each iteration

      / ||      MOV 1 2
        - ||
        + |||
      \\

      / |       MOV 0 1
        - |
        + ||
      \\

      / |||     CPY 2 0
        - |||
        + |
        + ||||
      \\
      / ||||
        - ||||
        + |||
      \\
      
      / |||     ADD 1 2
        - |||
        + ||
      \\

    \\  
    `
    const results = []
    const onOutput = mem => {
        results.push(mem[0])
    }
    strokepm(fib, [0, 1], 2000, onOutput)  // start with 0, 1

    expect(results.slice(0, 10)).toStrictEqual([0, 1, 1, 2, 3, 5, 8, 13, 21, 34])
})

test('Hello World', () => {
    const hello = `
    + | + | + |
    + || + || + || + || + || + || + || + || + || + ||
    + ||| + ||| + ||| + ||| + ||| + ||| + ||| + ||| + |||
    + |||| + |||| + |||| + |||| + |||| + |||| + |||| + ||||
    + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + ||||| + |||||
    + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + |||||| + ||||||
    + |||||||
    `
    const result = strokepm(hello)
    expect(result).toStrictEqual([3, 10, 9, 8, 30, 29, 1])

    let str = toBin(result[0]) 
            + toBin(result[1]) 
            + toBin(result[2]) 
            + toBin(result[3])
            + toBin(result[4])
            + toBin(result[5])
            + toBin(result[6])
    expect(str).toEqual('00011010100100101000111101110100001')

    const alphabet = []
    alphabet['000'] = ' '
    alphabet['001'] = 'd'
    alphabet['010'] = 'e'
    alphabet['011'] = 'H'
    alphabet['100'] = 'l'
    alphabet['101'] = 'o'
    alphabet['110'] = 'r'
    alphabet['111'] = 'W'

    let msg = ''
    for (let i = str.length - 3; i >= 0; i -= 3) {
        const ch = str.substring(i, i + 3)
        msg = alphabet[ch] + msg
    }

    expect(msg).toStrictEqual('Hello World')

    function toBin(n) {
      const s = n.toString(2) 
      return '0'.repeat(5 - s.length) + s
    }
})
