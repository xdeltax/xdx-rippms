import React from 'react'

export default class extends React.PureComponent {
  state = {
    show: false,
    showsub: [],
  }

  constructor(props) {
    super(props);
    const arr = Object.entries(props.data || []);
    arr && arr.map((item, idx) => this.state.showsub.push(props.startHidden ? false : true));
    //for (const [key, obj] of arr) { (key || obj) && this.state.showsub.push(props.startHidden ? false : true) }
  }

  toggle = () => { this.setState({ show: !this.state.show, }); }

  togglesub = (index) => { this.setState( state => {
    let arr = [...state.showsub]; // array spread into arr without getting mutated!
    arr[index] = !arr[index];
    return { showsub: arr, }
  })}

  render() {
    const { opacity, } = this.props;

    let styles = {
      root:       { overflow: 'auto', backgroundColor: `rgba(25,50,70,${opacity||1})`, color: '#fff', fontSize: '12px', padding:0, margin:0, },
      header:     { overflow: 'auto', padding: "0px 1px", margin:0, fontFamily: 'monospace', color: '#ffc600', },

      pre:        { overflow: 'auto', backgroundColor: `rgba(25,50,70,0.8)`, display: 'block', padding: "0px 10px", margin: '0', },
      subheader:  { overflow: 'auto', backgroundColor: `rgba(25,50,70,0.8)`, padding: "0px 10px", fontFamily: 'monospace', color: '#ffc600', },

      subpre:     { overflow: 'auto', display: 'block', padding: "0px 20px", margin: '0', },
      subpre2:    { overflow: 'auto', padding: "0px 0px", fontFamily: 'monospace', },
    }

    const RenderItems = ({data}) => {
      let items = [];
      const arr = Object.entries(data || []);
      arr && arr.map((item, idx) => items.push(<RenderItem key={idx} idx={idx} name={item[0]} obj={item[1]} />));
      return (
        <pre style={styles.pre}>
          {items}
        </pre>
      )
    }

    const RenderItem = ({idx, name, obj}) => {
      return (
        <React.Fragment>
          {((obj instanceof Object === true || Array.isArray(obj) === true) && Object.keys(obj).length > 0) ? ( // object or array in new block
            <div style={styles.root} onClick={()=>this.togglesub(idx)}>
              <span style={styles.subheader}>{name || "unnamed"}</span><span>{`<${typeof obj}> with ${Object.keys(obj).length} items`}</span>
              {(!this.state.showsub[idx]) ? null : (<pre style={styles.subpre}>{JSON.stringify(obj, null, 2)}</pre>)}
            </div>
          ) : ( // values in same line
            <div style={styles.root} onClick={()=>this.togglesub(idx)}>
              <span style={styles.subheader}>{name || "unnamed"}:</span><span style={styles.subpre2}>{JSON.stringify(obj, null, 2)}</span>
            </div>
          )}
        </React.Fragment>
      )
    }

    const RenderTitle = ({arr, colarr}) => {
      //<strong style={{color: "cyan"}}>{title}</strong>
      //<span style={{paddingLeft: 10, }}>{name}</span>
      //<span style={{paddingLeft: 10, color: "white"}}>{value}</span>
      if (!arr || arr.length <= 0) return null;

      let items = [];
      arr && arr.forEach((item, idx) => {
        const textcolor = colarr ? colarr[idx % colarr.length] : null;
        if (idx === 0) items.push(<strong key={idx} style={{color: textcolor || "cyan"}}>{item}</strong>);
        else items.push(<span key={idx} style={{color: textcolor || "white", }}>{item}</span>);
      });
      return (
        <div style={styles.header} onClick={this.toggle}>
          {items}
        </div>
      )
    }

    const { data, title, style, titleColors, } = this.props;
    return (!data && !title) ? // <DEBUGOBJECTPRETTY /> will render an empty space as placeholder
    (
      <div style={{...styles.root, ...{opacity:0.0,}, ...style, }}><div style={styles.header}/>{"_"}</div>
    ) : (
      <div style={{...styles.root, ...style, }}>
        <RenderTitle arr={title} colarr={titleColors} />
        {(!this.state.show) ? null : <RenderItems data={data} />}
      </div>
    )
  }
}
