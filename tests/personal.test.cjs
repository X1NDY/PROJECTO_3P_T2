const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require('node:path').join(__dirname, '../personal.js'), 'utf8')
    .replace(/^import .*;\r?\n/m, '');
const persona = { identidad: '0012345678901', nombres: 'Ana', apellidos: 'López',
    genero: 'Femenino', telefono: '9999-1111', direccion: 'Centro' };
const campos = Object.keys(persona);

function entorno() {
    const element = () => ({ value: '', children: [], listeners: {}, style: {},
        appendChild(child) { this.children.push(child); },
        replaceChildren(...children) { this.children = children; },
        addEventListener(event, callback) { this.listeners[event] = callback; },
        setAttribute() {}, focus() {}, scrollIntoView() {}, remove() {} });
    const nodes = Object.fromEntries([...campos, 'personalForm', 'guardarPersonal',
        'cancelarPersonal', 'tituloPersonal', 'personalTableBody', 'recargarPersonal',
        'totalPersonal'].map(id => [id, element()]));
    nodes.personalForm.reset = () => campos.forEach(campo => nodes[campo].value = '');
    nodes.personalForm.reportValidity = () => true;
    const calls = [];
    const state = { confirm: true, error: null, affected: true };
    let ready;
    const context = vm.createContext({
        document: { getElementById: id => nodes[id], createElement: element,
            body: element(), addEventListener: (_, callback) => ready = callback },
        confirm: () => state.confirm,
        setTimeout() {},
        supabaseClient: { from(table) {
            assert.equal(table, 'personal');
            const call = { operation: 'select' };
            calls.push(call);
            const query = {
                select() { return query; },
                order() { return query; },
                insert(data) { call.operation = 'insert'; call.payload = data; return query; },
                update(data) { call.operation = 'update'; call.payload = data; return query; },
                delete() { call.operation = 'delete'; return query; },
                eq(key, value) { call.key = key; call.value = value; return query; },
                then(resolve) { return Promise.resolve({ error: state.error,
                    data: call.operation === 'select' ? [persona] : state.affected ? [persona] : []
                }).then(resolve); }
            };
            return query;
        } }
    });
    vm.runInContext(source, context);
    ready();
    return { nodes, calls, state, context };
}

const settle = () => new Promise(resolve => setImmediate(resolve));
const submit = env => env.nodes.personalForm.listeners.submit({ preventDefault() {} });
const edit = env => vm.runInContext(`editarPersonal(${JSON.stringify(persona)})`, env.context);
const remove = env => vm.runInContext(`eliminarPersonal(${JSON.stringify(persona)})`, env.context);

test('muestra acciones, edita por identidad original y permite cancelar', async () => {
    const env = entorno();
    await settle();
    assert.equal(env.nodes.personalTableBody.children[0].children.length, 6);
    edit(env);
    assert.equal(env.nodes.identidad.readOnly, true);
    campos.forEach(campo => assert.equal(env.nodes[campo].value, persona[campo]));
    env.nodes.nombres.value = 'María';
    await submit(env);
    const update = env.calls.find(call => call.operation === 'update');
    assert.equal(update.key, 'identidad');
    assert.equal(update.value, '0012345678901');
    assert.equal(update.payload.nombres, 'María');
    assert.equal('identidad' in update.payload, false);
    assert.equal(env.nodes.identidad.readOnly, false);
    edit(env);
    env.nodes.cancelarPersonal.listeners.click();
    assert.equal(env.nodes.cancelarPersonal.hidden, true);
    assert.equal(env.nodes.identidad.readOnly, false);
});

test('crea registros y conserva los ceros de la identidad', async () => {
    const env = entorno();
    await settle();
    campos.forEach(campo => env.nodes[campo].value = persona[campo]);
    await submit(env);
    assert.equal(env.calls.find(call => call.operation === 'insert').payload[0].identidad, persona.identidad);
});

test('eliminar respeta cancelación y usa la clave identidad', async () => {
    const env = entorno();
    await settle();
    env.state.confirm = false;
    await remove(env);
    assert.equal(env.calls.some(call => call.operation === 'delete'), false);
    env.state.confirm = true;
    edit(env);
    await remove(env);
    const deleted = env.calls.find(call => call.operation === 'delete');
    assert.equal(deleted.key, 'identidad');
    assert.equal(deleted.value, persona.identidad);
    assert.equal(env.nodes.cancelarPersonal.hidden, true);
});

test('errores y operaciones sin registros afectados conservan la edición', async () => {
    const env = entorno();
    await settle();
    edit(env);
    env.state.error = { message: 'Sin permisos' };
    await submit(env);
    assert.equal(env.nodes.identidad.readOnly, true);
    assert.equal(env.nodes.guardarPersonal.disabled, false);
    env.state.error = null;
    env.state.affected = false;
    await remove(env);
    assert.equal(env.nodes.identidad.readOnly, true);
    assert.equal(env.nodes.guardarPersonal.disabled, false);
});
