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
            case '(': {
                if (!m[instr.variable]) pc = findNextLoopEnd(p, pc) + 1
                else pc++
                break
            }
            case ')': {
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
            if (p[pc].id === ')') pairs++
            if (p[pc].id === '(') {
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
            if (p[pc].id === '(') pairs++
            if (p[pc].id === ')') {
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
    if (-1 !== program.search(/[|]\s+[|]/g)) throw new Error('Syntax error: consequent vars')
    const source = program
        .replaceAll(/\//g, '(')
        .replaceAll(/\\/g, ')')
        .replaceAll(/[^)(+\-|!]/g, '') // remove all ignored chars

    const ast = []
    let open = 0 // count of open loops
    let i = 0
    while (i < source.length) {
        const instr = source[i++]
        let attr = ''
        while (i < source.length && /[^)(!+\-]/.test(source[i]))
            attr += source[i++]
        
        if (/[+]+/.test(instr)) { // increment variable
            if (!attr.length || !/[|]+/.test(attr)) throw new Error('Syntax error: missing inc var at ' + i)
        } else
        if (/[-]+/.test(instr)) { // decrement variable
            if (!attr.length || !/[|]+/.test(attr)) throw new Error('Syntax error: missing dec var at ' + i)
        } else
        if (/[(]/.test(instr)) { // loop start
            open++
            if (!attr.length || !/[|]+/.test(attr)) throw new Error('Syntax error: missing loop var at ' + i)
        } else
        if (/[)]/.test(instr)) { // loop end
            open--
            if (attr.length) throw new Error('Syntax error: not expected var at ' + i)
        } else
        if (/!+/.test(instr)) { // output
        } else 
            throw new Error('Syntax error: invalid instruction "' + instr + '" at ' + i)

        ast.push(new Instr(instr, attr.length - 1))

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