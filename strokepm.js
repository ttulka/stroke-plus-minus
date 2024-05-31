const MAX_STEPS = 1000000

const interpret = (program, memory, maxSteps, onOutput) => {   
    // initialize
    const p = parse(program)
    const m = memory ? memory : []
    const ms = maxSteps > 0 ? maxSteps : MAX_STEPS

    // execute
    let pc = 0   // program counter
    let sc = 0   // step counter
    while (pc < p.length && sc <= ms) {
        const instr = p[pc]

        switch (instr.id) {
            case '+': {
                m[instr.variable] = m[instr.variable] ? m[instr.variable] - 0 + 1 : 1
                pc++
                break
            }
            case '-': {
                m[instr.variable] = m[instr.variable] ? m[instr.variable] - 0 - 1 : 0
                pc++
                break
            }
            case '[': {
                if (!m[instr.variable]) pc = findNextLoopEnd(p, pc) + 1
                else pc++
                break
            }
            case ']': {
                pc = findPreviousLoopStart(p, pc)
                break
            }
            case '!': {
                if (onOutput instanceof Function) onOutput(normalizeMem(m))
                pc++
                break
            }
        }

        sc++
    }

    if (sc > MAX_STEPS) throw new Error('Maximal steps exceeded')

    return normalizeMem(m)

    function findPreviousLoopStart(p, pc) {
        let pairs = 0
        while (pc > 0) {
            pc--
            if (p[pc].id === ']') pairs++
            if (p[pc].id === '[') {
                if (!pairs) return pc
                pairs--
            }
        }
        throw new Error('Loop start not found')
    }

    function findNextLoopEnd(p, pc) {
        let pairs = 0
        while (pc < p.length - 1) {
            pc++
            if (p[pc].id === '[') pairs++
            if (p[pc].id === ']') {
                if (!pairs) return pc
                pairs--
            }
        }
        throw new Error('Loop end not found')
    }

    function normalizeMem(m) {
        let r = []
        const l = findMaxIdx(m)
        for (let i = 0; i <= l; i++) {
            r[i] = m[i] ? m[i] - 0 : 0
        }
        return r

        function findMaxIdx(m) {
            let i = m.length
            while (i >= 0 && !m[i]) i--
            return i
        }
    }
}

// parse the program to AST
function parse(program) {    
    const source = program
        .replaceAll(/[^\s\\/|!+-]/g, '') // remove all ignored chars
        .replaceAll(/\s+/g, ' ') // normalize white spaces
        .split(' ') // to array
        .filter(s => /[\s\\/|!+-]+/.test(s))  // filter out new lines etc

    const ast = []
    let open = 0 // count of open loops
    for (let i = 0; i < source.length; i++) {
        const instr = source[i]
        
        if (/[+]+/.test(instr)) { // increment variable
            i++
            if (i >= source.length || !/[|]+/.test(source[i])) throw new Error('Syntax error: missing inc var at ' + i)
            ast.push(new Instr('+', source[i].length - 1))
        } else
        if (/[-]+/.test(instr)) { // decrement variable
            i++
            if (i >= source.length || !/[|]+/.test(source[i])) throw new Error('Syntax error: missing dec var at ' + i)
            ast.push(new Instr('-', source[i].length - 1))
        } else
        if (/[/]/.test(instr)) { // loop start
            open++
            i++
            if (i >= source.length || !/[|]+/.test(source[i])) throw new Error('Syntax error: missing loop var at ' + i)
            ast.push(new Instr('[', source[i].length - 1))
        } else
        if (/[\\]/.test(instr)) { // loop end
            open--
            ast.push(new Instr(']'))
        } else
        if (/!+/.test(instr)) { // output
            ast.push(new Instr('!'))
        } else 
            throw new Error('Syntax error: invalid instruction "' + instr + '" at ' + i)

        if (open < 0) throw new Error('Syntax error: missing loop start at ' + i)
    }

    if (open) throw new Error('Syntax error: missing loop end(s)')

    return ast
}

class Instr {
    constructor(id, variable) {
        this.id = id
        this.variable = variable
    }
}

module.exports = interpret