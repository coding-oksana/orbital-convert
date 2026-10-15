const panel = (name: string) => cy.get(`[data-cy=panel-${name}]`);

const rect = (el: JQuery<HTMLElement>) => el[0].getBoundingClientRect();

const VIEWPORTS: [string, number, number, 'stacked' | 'side by side'][] = [
  ['phone', 375, 667, 'stacked'],
  ['tablet', 800, 1000, 'side by side'],
  ['desktop', 1280, 800, 'side by side'],
];

describe('Responsive layout', () => {
  VIEWPORTS.forEach(([device, width, height, layout]) => {
    it(`shows the panels ${layout} on a ${device} (${width}px)`, () => {
      cy.viewport(width, height);
      cy.visit('/');

      panel('keplerian').then((kep) => {
        panel('cartesian').then((cart) => {
          const k = rect(kep);
          const c = rect(cart);
          if (layout === 'stacked') {
            expect(c.top).to.be.greaterThan(k.bottom - 1);
          } else {
            expect(c.left).to.be.greaterThan(k.right - 1);
          }
        });
      });

      // nothing sticks out sideways
      cy.document().then((doc) => {
        const root = doc.documentElement;
        expect(root.scrollWidth).to.be.at.most(root.clientWidth);
      });
    });
  });

  it('lets a phone scroll to the derived values', () => {
    cy.viewport(375, 667);
    cy.visit('/');

    cy.get('[data-cy=field-v]').scrollIntoView().should('be.visible');
  });
});
