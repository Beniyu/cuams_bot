import {getAllPermissions} from "./permissions";

test('Test wildcard permission converter', () => {
    let baseCase = getAllPermissions('');
    let normalCase = getAllPermissions('command.use.test');
    let errorCase = getAllPermissions('...');

    // Empty string should only return empty string and wildcard
    expect(baseCase).toEqual(['*', '']);

    // Normal string should return all intermediate wildcards and itself
    expect(normalCase).toEqual(['*', 'command.*', 'command.use.*','command.use.test']);

    // Error case should still process without failing
    expect(errorCase).toEqual(['*', '.*','..*','...*', '...']);
})