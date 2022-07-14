
import { useState, useRef, useEffect } from 'react';
import { ForceGraph3D } from 'react-force-graph';
import { Node, NodesAndLinks, getGraphData, getSampleData } from './helpers'
import * as three from 'three'
import styled from "styled-components";
import ReactAudioPlayer from 'react-audio-player';


let inDebounce:any = null
async function debounce(func:Function, delay:number) {
  clearTimeout(inDebounce)
  inDebounce = setTimeout(() => {
      func()
  }, delay)
}

export default function KnowledgeMap(props: any) {
  const { onNodeClicked, searchTerm, setLoading, mapRef } = props
  const [graphData, setGraphData]: any = useState<NodesAndLinks>({ nodes: [], links: [] })
  const [selectedCluster, setSelectedCluster]: any = useState(null)
  const [focusedNode, setFocusedNode]:any = useState(null)
  const [selectedEpisodes, setSelectedEpisodes]: any = useState({})
  const [showList, setShowList]: any = useState(true)

  // init with default dataset
  useEffect(() => {
    const d = getSampleData()
    setGraphData(d)
  }, [])

  // refresh after search term is changed
  useEffect(() => {
    debounce(() => getData(),800)
  }, [searchTerm])

  async function getData() {
    if (searchTerm) {
      setLoading(true)
      const d = await getGraphData(searchTerm)  
      setGraphData(d)
      setShowList(true)
      setLoading(false)    
    }
  }

  useEffect(() => {
    // set scroll to element
    if (focusedNode&&focusedNode.details) {
      const episodeElement = document.getElementById(focusedNode.details.podcast_title)
      if (episodeElement) episodeElement.scrollIntoView({ behavior: "smooth" })
    }
    }, [focusedNode])

  const nodeObject = (color:string, size:number) => {
      const geometry = new three.SphereGeometry(size, 32, 32); // (radius, widthSegments, heightSegments)
      const material = new three.MeshBasicMaterial( {color: color} );
      const sphere = new three.Mesh(geometry, material);

      return sphere
  }
  
  const linkObject = () => {
    const material = new three.LineBasicMaterial({color: '#000'});
    const geometry = new three.BufferGeometry();
    const line = new three.Line( geometry, material );

    return line
  }
  
  function clickNode(node: any) {
    setShowList(true)

    if (!focusedNode || node.id !== focusedNode.id) {
      setFocusedNode(node)

      const thisPoint = {
        x: node.x,
        y: node.y,
        z: node.z
      }

      mapRef.current.cameraPosition({ ...thisPoint, z: node.z - 100 }, thisPoint, 0)
    }
  }

  
    const groupedPodcasts: any = {}
    
    graphData?.nodes?.forEach((d: Node, i: number) => {
      if (d.details?.podcast_title && !groupedPodcasts[d.details?.podcast_title]) {
        groupedPodcasts[d.details?.podcast_title] = {
          title: d.details?.podcast_title,
          img: null,
          episodes: [
            {
              title:d.details?.episode_title,
              media_url: d.details?.link
            }
          ]
        }
      } else if (d.details?.podcast_title){
        groupedPodcasts[d.details?.podcast_title].episodes.push({
          title:d.details?.episode_title,
          media_url: d.details?.link
        })
      }
    })
   

  

  return <>
     {showList&&Object.keys(groupedPodcasts)?.length>0 &&
      <ListWindow onClick={(e) => e.preventDefault()}>

          <Close onClick={()=>setShowList(false)}>
            X Close
          </Close>
        
        <Padding>
          {/* clusters */}

          {Object.keys(groupedPodcasts).map((keyname: string, i: number) => {
            const podcast = groupedPodcasts[keyname]
            const { title, image, episodes } = podcast

            const audioUrl:any = selectedEpisodes[keyname]?selectedEpisodes[keyname]:episodes[0].media_url
            
              return <NodePanel key={i + 'ouahsf'}>

                <Avatar />
                <div style={{ width: 40 }} />

                <Col style={{maxWidth:'80%'}}>
                  <Col style={{height:100}}>
                    <Title>{title}</Title>
                    <div style={{ height: 10 }} />
                    
                      <ReactAudioPlayer
                      style={{width:'100%'}}
                      src={audioUrl}
                      controls
                      />
                    
                  </Col>
                  {/* scrolling list */}

                  <div style={{marginBottom:5}}>Episodes</div>
                  <Scroller >
                    {episodes.map((e: any, ii: number) => {
                      
                      const selected = () => {
                        if (!selectedEpisodes[keyname] && ii === 0) return true
                        return selectedEpisodes[keyname] === e.media_url
                      }

                      const isSelected = selected()
                      return <EpisodePanel id={keyname} key={keyname + '_' + i + '_' + ii}
                        onClick={() => {
                          const se: any = { ...selectedEpisodes }
                          se[keyname] = e.media_url
                          setSelectedEpisodes(se)
                        }}
                      style={{fontWeight:isSelected?600:300}}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',fontSize:30,marginRight:20}}>
                          {ii+1}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <Subtitle>{e.title}</Subtitle>
                          {/* <Subtitle>{e.media_url}</Subtitle> */}
                        </div>
                      </EpisodePanel>
                    })}
                    
                  </Scroller>
                </Col>
              </NodePanel>  
          })}
        </Padding>

        
    </ListWindow>
      }
    
    <ForceGraph3D
    ref={mapRef}
    graphData={graphData}
    nodeVisibility={() => {
      // hide nodes if not hovered
      return true
    }}
    linkVisibility={() => {
      // hide links if not hovered
      return true
    }}
    rendererConfig={{
      // depth:false,
      stencil:false,
      powerPreference:'low-power',
      precision: 'lowp',
      
    }}
    nodeRelSize={8}
    linkOpacity={1}
    nodeOpacity={0.8}
    onNodeDrag={(node: any) => clickNode(node)}
    onNodeClick={(node: any) => clickNode(node)}
    backgroundColor={'#f1f1f1'}
    nodeLabel={(node: any) => `${node.name}`}
    nodeAutoColorBy="type"
    linkThreeObject={linkObject}
      nodeThreeObject={(node:any) => {
        // console.log('node', node)
        let color = 'red'
        let size = 5
        if (node.type === 'podcast') {
          size = 5
          color = 'teal'
        }
        else if (node.type === 'topic') {
          size = 10
          color = 'red'
        }
        return nodeObject(color,size)
      }}
  />
  
  
    </>
}

const Row = styled.div`
display:flex;
width:100%;
`
const Col = styled.div`
display:flex;
flex-direction:column;
width:100%;
`

const Scroller = styled.div`
display:flex;
flex-direction:column;
width:100%;
max-width:100%;
height: 120px; 
overflow: auto;
overflow-x:hidden; 
background: #eee; 
`
const NodePanel = styled.div`
display:flex;
align-items:center;
width:100%;
min-height:100px;
padding:10px;
border-bottom:1px solid #ccc;

&:hover{
  opacity:1;
}
`

const EpisodePanel = styled.div`
display:flex;
align-items:center;
width:100%;
padding:10px;
border-bottom:1px solid #ccc;
opacity:0.8;
cursor:pointer;
&:hover{
  opacity:1;
  z-index:20;
}
`

const ListWindow = styled.div`
display:flex;
flex-direction:column;
position:absolute;
left:30px;
top:80px;
height:calc(100% - 100px);
background:#fff;
max-width:40%;
width:40%;
z-index:30000;
border-radius:10px;
box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
overflow:auto;

`
const Close = styled.div`
position:fixed;
margin:10px 20px;
background:#f1f1f1;
cursor:pointer;
color:#000;
box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
padding:20px;
border-radius:30px;
`


const Padding = styled.div`
padding:30px;
`


const Avatar = styled.div`
background-image:url(blah);
min-width:70px;
min-height:70px;
border-radius:5px;
background:#000;
`

const Title = styled.div`
font-size:20px;
overflow: hidden;
text-overflow: ellipsis;
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
`

const Subtitle = styled.div`
font-size:14px;
overflow: hidden;
text-overflow: ellipsis;
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
`