// ❌

function upcaseFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

let tagFamilies = {
  optional: {
    name: 'optional',
    text: 'It is',
    tags: ['optional'],
    appliesTo: ['entity', 'resource', 'outcome']
  },
  playerAttitude: {
    name: 'playerAttitude',
    text: 'Player thinks it\'s',
    tags: ['good', 'neutral', 'bad', 'complicated'],
    appliesTo: ['entity', 'resource', 'outcome']
  },
  initialLevel: {
    name: 'initialLevel',
    text: 'Value starts off',
    tags: ['full', 'high', 'middling', 'low', 'empty'],
    appliesTo: ['resource']
  },
  tendency: {
    name: 'tendency',
    text: 'Tends to',
    tags: ['increase rapidly', 'increase slowly', 'stay the same',
           'decrease slowly', 'decrease rapidly', 'fluctuate wildly'],
    appliesTo: ['resource']
  }
};

function parseTag(fullTagText) {
  console.log('parseTag', fullTagText);
  let tagFamily = Object.values(tagFamilies).find(family => fullTagText.startsWith(family.text));
  let tagValue = fullTagText.replace(tagFamily.text, '').trim();
  return {family: tagFamily.name, familyInfo: tagFamily, value: tagValue};
}

function activeTags(thingNode) {
  return [...thingNode.querySelectorAll('.tag')].map(tn => parseTag(tn.innerText));
}

function cycleTag(fullTagText) {
  let tag = parseTag(fullTagText);
  let tagFamily = tag.familyInfo;
  let tagValue = tag.value;
  let tagIndex = tagFamily.tags.indexOf(tagValue);
  let nextTagIndex = (tagIndex + 1 >= tagFamily.tags.length) ? 0 : tagIndex + 1;
  return tagFamily.text + ' ' + tagFamily.tags[nextTagIndex];
}

let exampleIntent = {
  entities: [
    {
      name: "Friend",
      icon: "💁",
      tags: [
        {family: 'playerAttitude', value: 'good'}
      ]
    },
    {
      name: "",
      icon: "❓",
      tags: [
        {family: 'optional', value: 'optional'}
      ]
    }
  ],
  resources: [
    {
      name: "Depression",
      tags: [
        {family: 'playerAttitude', value: 'bad'},
        {family: 'initialLevel', value: 'low'},
        {family: 'tendency', value: 'increase slowly'}
      ]
    },
    {
      name: "Resource2",
      tags: [
        {family: 'optional', value: 'optional'},
        {family: 'playerAttitude', value: 'bad', isNegated: true},
      ]
    }
  ],
  relationships: [
    {
      lhs: "Friend",
      type: "collides with",
      rhs: "Insecurity"
    },
    {
      lhs: "Insecurity",
      type: "produces",
      rhs: "Depression"
    }
  ],
  triggers: []
}

function createNode(html) {
  let div = document.createElement('div');
  div.innerHTML = html;
  return div.firstChild;
}

function negateTag(tagNode) {
  if (tagNode.classList.contains('negated')) {
    tagNode.classList.remove('negated');
  } else {
    tagNode.classList.add('negated');
  }
}

function wireUpOnclickHandlers(thingNode) {
  for (let editTagsLink of thingNode.querySelectorAll('.edit-tags')) {
    editTagsLink.onclick = function() {
      openTagEditor(thingNode);
    };
  }
  for (let deleteButton of thingNode.querySelectorAll('.delete')) {
    deleteButton.onclick = function() {
      thingNode.remove();
    }
  }
  for (let tagNode of thingNode.querySelectorAll('.tag')) {
    tagNode.onclick = function() {
      if (negateModeActive) {
        negateTag(tagNode);
      } else {
        tagNode.innerText = cycleTag(tagNode.innerText);
      }
    }
  }
}

function createEntityNode(entity) {
  let html = `<div class="thing entity">
    <div class="minibuttons">
      <div class="minibutton randomize">🎲</div>
      <div class="minibutton delete">🗑️</div>
    </div>
    <input type="text" class="thing-name" value="${entity.name}"
           placeholder="[random name]">
    <div class="entity-icon">${entity.icon}</div>
    <div class="tags">`;
  for (let tag of entity.tags) {
    let tagText = tagFamilies[tag.family].text + ' ' + tag.value;
    html += `<span class="tag${tag.isNegated ? ' negated' : ''}">${upcaseFirst(tagText.trim())}</span>`
  }
  html += `</div><a class="edit-tags">edit tags</a>`;
  html += `</div>`;
  let node = createNode(html);
  wireUpOnclickHandlers(node);
  return node;
}

function createStaticEntityNode(entity) {
  let html = `<div class="thing entity">
    <div class="thing-name">${entity.name}</div>
    <div class="entity-icon">${entity.icon}</div>
    <div class="tags">`;
  for (let tag of entity.tags) {
    let tagText = tagFamilies[tag.family].text + ' ' + tag.value;
    html += `<span class="tag${tag.isNegated ? ' negated' : ''}">${upcaseFirst(tagText.trim())}</span>`
  }
  html += `</div>`;
  return createNode(html);
}

function createResourceNode(resource) {
  let html = `<div class="thing resource">
    <div class="minibuttons">
      <div class="minibutton randomize">🎲</div>
      <div class="minibutton delete">🗑️</div>
    </div>
    <input type="text" class="thing-name" value="${resource.name}"
           placeholder="[random name]">
    <div class="tags">`;
  for (let tag of resource.tags) {
    let tagText = tagFamilies[tag.family].text + ' ' + tag.value;
    html += `<span class="tag${tag.isNegated ? ' negated' : ''}">${upcaseFirst(tagText.trim())}</span>`
  }
  html += `</div><a class="edit-tags">edit tags</a>`;
  html += `</div>`;
  let node = createNode(html);
  wireUpOnclickHandlers(node);
  return node;
}

function createStaticResourceNode(resource) {
  let html = `<div class="thing resource">
    <div class="thing-name">${resource.name}</div>
    <div class="tags">`;
  for (let tag of resource.tags) {
    let tagText = tagFamilies[tag.family].text + ' ' + tag.value;
    html += `<span class="tag${tag.isNegated ? ' negated' : ''}">${upcaseFirst(tagText.trim())}</span>`
  }
  html += `</div>`;
  return createNode(html);
}

function createRelationshipNode(relationship) {
  let html = `<div class="relationship">
    <div class="minibutton randomize">🎲</div>
    <span class="not">NOT </span>
    <input type="text" value="${relationship.lhs}" placeholder="Something">
    <select>
      <option value=""${relationship.type === 'is related to' ? ' selected' : ''}>is related to</option>
      <option value=""${relationship.type === 'consumes' ? ' selected' : ''}>consumes</option>
      <option value=""${relationship.type === 'produces' ? ' selected' : ''}>produces</option>
      <option value=""${relationship.type === 'defeats' ? ' selected' : ''}>defeats</option>
      <option value=""${relationship.type === 'avoids' ? ' selected' : ''}>avoids</option>
      <option value=""${relationship.type === 'collides with' ? ' selected' : ''}>collides with</option>
    </select>
    <input type="text" value="${relationship.rhs}" placeholder="something">
    <div class="minibutton delete">🗑️</div>
  </div>`;
  let node = createNode(html);
  wireUpOnclickHandlers(node);
  node.onclick = function() {
    if (negateModeActive) {
      if (node.classList.contains('negated')) {
        node.classList.remove('negated');
      } else {
        node.classList.add('negated');
      }
    }
  }
  return node;
}

function createStaticRelationshipNode(relationship) {
  let html = `<div class="relationship">
    <span class="lhs">${relationship.lhs}</span>
    <span> ${relationship.type} </span>
    <span class="rhs">${relationship.rhs}</span>
  </div>`;
  let node = createNode(html);
  return node;
}

function createTagEditorNode(thingType, thingNode) {
  let thingTags = activeTags(thingNode);
  let html = `<div class="tag-editor">
    <div class="close-tag-editor">X</div>`;
  for (let familyName of Object.keys(tagFamilies)) {
    let family = tagFamilies[familyName];
    if (family.appliesTo.indexOf(thingType) < 0) continue;
    html += `<div class="tag-family">${family.text}: `;
    for (let tag of family.tags) {
      let isActiveOnThing = thingTags.find(t => t.value === tag && t.family === familyName);
      html += `<span class="tag${isActiveOnThing ? ' active' : ''}">${tag}</span>`;
    }
    html += `</div>`;
  }
  html += `</div>`;
  let node = createNode(html);
  let closeTagEditor = node.querySelector('.close-tag-editor');
  closeTagEditor.onclick = function() {
    node.remove();
  }
  for (let tagNode of node.querySelectorAll('.tag')) {
    // TODO dear god this is brittle.
    // maybe make thing tag nodes change the active editor tag node if you click em while the editor is open?
    // maybe check if the tag family we're changing is negated, and persist the negation if it is?
    tagNode.onclick = function() {
      let familyText = tagNode.parentNode.innerText.split(':')[0];
      console.log(familyText);
      let family = Object.values(tagFamilies).find(tf => tf.text === familyText);
      console.log(family);
      let thingTagNodes = [...thingNode.querySelectorAll('.tag')];
      if (tagNode.classList.contains('active')) {
        tagNode.classList.remove('active');
        // remove corresponding tag from thingNode tags
        thingTagNodes.find(tn => tn.innerText.startsWith(family.text)).remove();
      } else {
        let otherActiveEditorTagNodeInFamily = tagNode.parentNode.querySelector('.active');
        if (otherActiveEditorTagNodeInFamily) {
          otherActiveEditorTagNodeInFamily.classList.remove('active');
          // remove corresponding tag from thingNode tags
          thingTagNodes.find(tn => tn.innerText.startsWith(family.text)).remove();
        }
        tagNode.classList.add('active');
        // add corresponding tag to thingNode tags
        let tagText = `${family.text} ${tagNode.innerText}`;
        let newThingTagNode = createNode(`<span class="tag">${upcaseFirst(tagText.trim())}</span>`);
        thingNode.querySelector('.tags').appendChild(newThingTagNode);
        // copied from wireUpOnclickHandlers - make the newThingTagNode behave correctly on click
        newThingTagNode.onclick = function() {
          if (negateModeActive) {
            negateTag(newThingTagNode);
          } else {
            newThingTagNode.innerText = cycleTag(newThingTagNode.innerText);
          }
        }
      }
    }
  }
  return node;
}

function openTagEditor(thingNode) {
  let existingTagEditorNode = document.querySelector('.tag-editor');
  if (existingTagEditorNode) existingTagEditorNode.remove();

  // get the type of the thing whose tags we want to edit
  let thingType = [...thingNode.classList].find(c => c === 'entity' || c === 'resource' || c === 'outcome');

  let tagEditorNode = createTagEditorNode(thingType, thingNode);
  thingNode.appendChild(tagEditorNode);
}

for (let entity of exampleIntent.entities) {
  let node = createEntityNode(entity);
  intentEntitiesList.lastElementChild.insertAdjacentElement('beforebegin', node);
  let staticNode = createStaticEntityNode(entity);
  generatedEntitiesList.appendChild(staticNode);
}
for (let resource of exampleIntent.resources) {
  let node = createResourceNode(resource);
  intentResourcesList.lastElementChild.insertAdjacentElement('beforebegin', node);
  let staticNode = createStaticResourceNode(resource);
  generatedResourcesList.appendChild(staticNode);
}
for (let relationship of exampleIntent.relationships) {
  let node = createRelationshipNode(relationship);
  intentRelationshipsList.lastElementChild.insertAdjacentElement('beforebegin', node);
  let staticNode = createStaticRelationshipNode(relationship);
  generatedRelationshipsList.appendChild(staticNode);
}
/*
for (let trigger of exampleIntent.triggers) {
  createTriggerNode(trigger);
}
*/

newEntityButton.onclick = function() {
  let defaultEntity = {
    name: "",
    icon: "❓",
    tags: [{family: 'optional', value: 'optional'}]
  };
  let node = createEntityNode(defaultEntity);
  intentEntitiesList.lastElementChild.insertAdjacentElement('beforebegin', node);
}

newResourceButton.onclick = function() {
  let defaultResource = {
    name: "",
    tags: [{family: 'optional', value: 'optional'}]
  };
  let node = createResourceNode(defaultResource);
  intentResourcesList.lastElementChild.insertAdjacentElement('beforebegin', node);
}

newRelationshipButton.onclick = function() {
  let defaultRelationship = {lhs: '', type: 'is related to', rhs: ''};
  let node = createRelationshipNode(defaultRelationship);
  intentRelationshipsList.lastElementChild.insertAdjacentElement('beforebegin', node);
}

let negateModeActive = false;

toggleNegateMode.onclick = function() {
  negateModeActive = !negateModeActive;
  toggleNegateMode.innerText = `${negateModeActive ? 'Disable' : 'Enable'} negate mode`;
  if (negateModeActive) {
    toggleNegateMode.classList.remove('inactive');
  } else {
    toggleNegateMode.classList.add('inactive');
  }
}
