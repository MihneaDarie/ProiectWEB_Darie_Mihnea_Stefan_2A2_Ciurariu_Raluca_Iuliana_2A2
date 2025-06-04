

document.addEventListener('DOMContentLoaded', () => {
  const btn  = document.getElementById('statsButton');
  const card = document.querySelector('.profile-container');
  const ENDPOINT = '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?action=distribution';

  const buildBars = rows => {
    const wrapper = document.createElement('div');
    wrapper.className = 'bar-list';

    const palette = ['#007bff', '#ff4757', '#ffa502', '#2ed573', '#8e44ad'];

    rows.forEach((r, idx) => {
      const row = document.createElement('div');
      row.className = 'bar-row';

 
      const label = document.createElement('span');
      label.className = 'bar-label';
      label.textContent = r.TYPE;
      row.appendChild(label);

      const track = document.createElement('div');
      track.className = 'bar-track';

      const fill  = document.createElement('div');
      fill.className = 'bar-fill';
      fill.style.width = `${r.PERCENTAGE}%`;
      fill.style.background = palette[idx % palette.length];

      track.appendChild(fill);
      row.appendChild(track);

     
      const value = document.createElement('span');
      value.className = 'bar-value';
      value.textContent = `${r.TYPE_COUNT} (${r.PERCENTAGE}%)`;
      row.appendChild(value);

      wrapper.appendChild(row);
    });
    return wrapper;
  };

  btn.addEventListener('click', async () => {

    Array.from(document.body.children).forEach(el => { if (el !== card) el.remove(); });
    card.replaceChildren();
    card.style.minHeight = '85vh';
    card.style.padding   = '2rem';

    const loader = document.createElement('p');
    loader.textContent = 'Se încarcă…';
    card.appendChild(loader);

    try {
      const res  = await fetch(ENDPOINT, { credentials: 'include' });
      const json = await res.json();
      console.log('STATISTIC DATA →', json.data);   

      if (!res.ok) throw new Error(json.error || 'Eroare necunoscută');

      card.replaceChildren();
      const h3 = document.createElement('h3');
      h3.textContent = 'Statistics';
      card.appendChild(h3);

      if (!json.data.length) {
        card.appendChild(document.createTextNode('Nu există date statistice.'));
        return;
      }

      card.appendChild(buildBars(json.data));

    } catch (err) {
      card.replaceChildren();
      card.textContent = err.message;
      console.error(err);
    }
  });
});
