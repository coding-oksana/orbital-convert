const field = (name: string) => cy.get(`[data-cy=field-${name}]`);

const setField = (name: string, value: string) =>
  field(name).clear().type(value);

// fields show a typographic minus (−), Number() only understands '-'
const toNumber = (text: string) => Number(text.replace('−', '-'));

describe('Orbital element converter', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('shows the ISS orbit on load', () => {
    field('a').should('have.value', '6786');
    field('e').should('have.value', '0.002');
    field('x').should('have.value', '4354.2');
    field('y').should('have.value', '−255.5');
    field('vy').should('have.value', '7.303');
    field('r').should('have.value', '6774.0');
    field('v').should('have.value', '7.678');
    cy.get('[data-cy=badge-blue]').should('have.text', 'source');
    cy.get('[data-cy=badge-green]').should('have.text', 'computed');
  });

  it('updates the Cartesian state when a Keplerian element changes', () => {
    setField('a', '7000');

    field('x').should('have.value', '4491.5');
    field('r').should('have.value', '6987.6');
    field('v').should('have.value', '7.559');
  });

  it('updates the Keplerian elements when the Cartesian state changes', () => {
    setField('vy', '7.5');

    cy.get('[data-cy=badge-green]').should('have.text', 'source');
    cy.get('[data-cy=badge-blue]').should('have.text', 'computed');
    field('a').invoke('val').should('not.eq', '6786');
  });

  it('keeps a geostationary satellite in place on a round trip', () => {
    // equatorial circular orbit, satellite on the y axis
    setField('x', '0');
    setField('y', '42164');
    setField('z', '0');
    setField('vx', '-3.07467'); // circular speed √(μ/r)
    setField('vy', '0');
    setField('vz', '0');

    field('e').should('have.value', '0.000');
    field('i').should('have.value', '0.0');

    // editing a Keplerian field converts back to Cartesian
    field('a')
      .invoke('val')
      .then((a) => setField('a', String(a)));

    field('x')
      .invoke('val')
      .then((x) => expect(Math.abs(toNumber(String(x)))).to.be.lessThan(5));
    field('y')
      .invoke('val')
      .then((y) => expect(toNumber(String(y))).to.be.closeTo(42164, 5));
  });

  it('ignores letters and spaces', () => {
    field('a').type('abc 1');

    field('a').should('have.value', '67861');
  });

  it('rejects an eccentricity of 1 or more', () => {
    setField('e', '1.5');

    field('e').should('have.attr', 'aria-invalid', 'true');
    cy.get('[data-cy=issue-error]').should(
      'contain.text',
      'Eccentricity must be'
    );
    cy.get('[data-cy=badge-green]').should('have.text', 'not updated');
    field('x').should('have.value', '4354.2');
  });

  it('asks for a number when a field is empty', () => {
    field('i').clear();

    field('i').should('have.attr', 'aria-invalid', 'true');
    cy.get('[data-cy=issue-error]').should(
      'have.text',
      'Enter a number in every field.'
    );
  });

  it('warns but still converts when the orbit would hit Earth', () => {
    setField('a', '6300');

    cy.get('[data-cy=issue-warning]').should('contain.text', 'would hit Earth');
    cy.get('[data-cy=issue-error]').should('not.exist');
    field('x').should('not.have.value', '4354.2');
  });

  it('rejects a speed above escape speed', () => {
    setField('vx', '20');

    field('vx').should('have.attr', 'aria-invalid', 'true');
    cy.get('[data-cy=issue-error]').should('contain.text', 'escape speed');
    cy.get('[data-cy=badge-blue]').should('have.text', 'not updated');
  });

  it('rejects a position inside Earth', () => {
    setField('x', '1');

    cy.get('[data-cy=issue-error]').should('contain.text', 'inside Earth');
    field('x').should('have.attr', 'aria-invalid', 'true');
  });

  it('resets to the ISS orbit and clears messages', () => {
    setField('e', '1.5');
    cy.get('[data-cy=reset]').click();

    field('e').should('have.value', '0.002');
    field('x').should('have.value', '4354.2');
    cy.get('[data-cy=issue-error]').should('not.exist');
    cy.get('[data-cy=badge-blue]').should('have.text', 'source');
  });

  it('copies the current values as JSON', () => {
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, 'writeText').as('copy').resolves();
    });

    cy.get('[data-cy=copy-json]').click();

    cy.get('@copy')
      .should('have.been.calledOnce')
      .its('firstCall.args.0')
      .then((text) => {
        const data = JSON.parse(String(text));
        expect(data.keplerian.a).to.eq('6786');
        expect(data.cartesian.x).to.eq('4354.2');
        expect(data.source).to.eq('keplerian');
      });

    cy.get('[data-cy=copy-tooltip]').should('have.text', '✓ Copied');
    cy.get('[data-cy=copy-tooltip]').should('not.exist');
  });

  it('says so when copying fails', () => {
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, 'writeText').rejects(
        new Error('denied')
      );
    });

    cy.get('[data-cy=copy-json]').click();

    cy.get('[data-cy=copy-tooltip]').should('have.text', "Couldn't copy");
  });
});
