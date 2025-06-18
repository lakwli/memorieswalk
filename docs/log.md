                 In Page A:
                  {elements.map((element) =>
                    RendererFactory.createRenderer(
                      element,
                      createRendererProps(element)
                    )
                  )}

in RendererFactory:
export class RendererFactory {
static renderers = {
[ELEMENT_TYPES.PHOTO]: React.memo(PhotoRenderer),
[ELEMENT_TYPES.TEXT]: React.memo(TextRenderer),
[ELEMENT_TYPES.PEN]: React.memo(PenRenderer),
};

static createRenderer(element, props) {
// All existing logging code stays exactly the same
const renderCount = (window.rendererFactoryCounts =
window.rendererFactoryCounts || {});
const key = `${element.type}-${element.id}`;
renderCount[key] = (renderCount[key] || 0) + 1;

    console.log("🔍 RendererFactory createRenderer");
    console.log("🔍 RendererFactory element.type", element.type);
    console.log(
      "🔍 RendererFactory render count for",
      key,
      ":",
      renderCount[key]
    );

    if (renderCount[key] > 2) {
      console.warn(
        `🚨 EXCESSIVE RENDERS: ${key} has rendered ${renderCount[key]} times!`
      );
    }

    const propsKeys = Object.keys(props);
    console.log("🔍 RendererFactory elementProps keys:", propsKeys);
    console.log("🔍 RendererFactory isBeingEdited:", props.isBeingEdited);

    const RendererComponent = this.renderers[element.type];
    if (!RendererComponent) {
      console.warn(`No renderer found for element type: ${element.type}`);
      return null;
    }

    return <RendererComponent key={element.id} element={element} {...props} />;

}

static registerRenderer(type, rendererComponent) {
this.renderers[type] = React.memo(rendererComponent);
}
}

in BaseRenderer:
render() {
return (
<React.Fragment key={this.element.id}>
<Group {...this.elementProps}>{this.renderContent()}</Group>
</React.Fragment>
);
}

one of the Renderer: TextRenderer:
renderContent() {
const width = this.element.width || 200;
const height = this.element.height || 60;

    // Debug what elementProps contains
    console.log("🔍 TextRenderer elementProps:", this.elementProps);
    console.log("🔍 Element ID:", this.element.id);
    console.log("🔍 Element getProps():", this.element.getProps?.());

    return (
      <React.Fragment>
        {this.element.backgroundShape &&
          this.element.backgroundShape !== "none" &&
          this.renderBackground()}

        <KonvaText
          ref={this.textRef}
          text={this.element.text}
          fontSize={this.element.fontSize}
          fontFamily={this.element.fontFamily}
          fill={this.element.fill}
          width={width}
          height={height}
          align={this.element.align}
          verticalAlign={this.element.verticalAlign}
          wrap={this.element.wrap}
          fontStyle={this.element.fontStyle}
          textDecoration={this.element.textDecoration}
        />
      </React.Fragment>
    );

}
}
