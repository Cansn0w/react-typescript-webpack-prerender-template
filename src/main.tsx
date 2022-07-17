import { createApp } from "app/create";
import * as React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

class AppLoader extends React.Component<
  {},
  { bootstrap?: { content: string } }
> {
  constructor(props: {}) {
    super(props);
    this.state = { bootstrap: undefined };
  }

  componentDidMount() {
    fetch("api")
      .then((res) => res.json())
      .then(({ content }) => {
        if (content) {
          this.setState({ bootstrap: { content: content } });
        }
      });
  }

  render() {
    if (this.state.bootstrap) {
      return createApp(this.state.bootstrap);
    } else {
      return <div>Loading...</div>;
    }
  }
}

createRoot(document.getElementById("root")!).render(<AppLoader />);
