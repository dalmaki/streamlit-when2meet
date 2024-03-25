import {
  Streamlit,
  StreamlitComponentBase,
  withStreamlitConnection,
  Theme,
} from "streamlit-component-lib"
import React, {
  ReactNode,
  createContext,
  createRef,
  forwardRef,
  useContext,
  useEffect,
  useState,
} from "react"

const StateContext = createContext<State | null>(null)

interface State {
  startTime: number
  endTime: number
  disabled: boolean
  data: number[][]
  theme: Theme | undefined
}

interface When2MeetSectionProps {
  startTime?: number
  endTime?: number
}

const When2MeetSection = forwardRef<HTMLDivElement, When2MeetSectionProps>(
  (props, ref) => {
    const style: React.CSSProperties = {}

    const { startTime, endTime, theme } = useContext(StateContext)!

    if (theme) {
      style.backgroundColor = theme.primaryColor
      style.width = "100%"
      style.position = "absolute"
      style.opacity = 0.2

      if (props.startTime) {
        style.top =
          ((props.startTime - startTime) / (endTime - startTime)) * 100 + "%"

        if (props.endTime) {
          style.height =
            ((props.endTime - props.startTime) / (endTime - startTime)) * 100 +
            "%"
        }
      }
    }

    return <div className="sw2m-section" ref={ref} style={style} />
  }
)

const When2MeetColumn = ({
  date,
  onRegister,
}: {
  date: number
  onRegister: (
    date: number,
    startTime: number,
    endTime: number,
    removing?: boolean
  ) => void
}) => {
  const style: React.CSSProperties = {}
  const style_text: React.CSSProperties = {}
  const style_bg: React.CSSProperties = {}

  const { startTime, endTime, theme, data, disabled } =
    useContext(StateContext)!
  const sectionRef = createRef<HTMLDivElement>()
  const divRef = createRef<HTMLDivElement>()

  let [view, setView] = useState(false)
  let [startY, setStartY] = useState(0)
  let [removing, setRemoving] = useState(false)

  const remPerHour = (30 * 3600) / (endTime - startTime)

  function onMove(clientY: number) {
    const rect = divRef.current!.getBoundingClientRect()
    const y = clientY - rect.top
    const h = y - startY

    if (h < 0) {
      sectionRef.current!.style.top = y / 16 + "rem"
      sectionRef.current!.style.height = -h / 16 + "rem"
    } else {
      sectionRef.current!.style.top = startY / 16 + "rem"
      sectionRef.current!.style.height = h / 16 + "rem"
    }
  }

  function onMoveRemoving(clientY: [number, number]) {
    const rect = divRef.current!.getBoundingClientRect()
    const y1 = clientY[0] - rect.top
    const y2 = clientY[1] - rect.top
    const h = y2 - y1

    if (h < 0) {
      sectionRef.current!.style.top = y2 / 16 + "rem"
      sectionRef.current!.style.height = -h / 16 + "rem"
    } else {
      sectionRef.current!.style.top = y1 / 16 + "rem"
      sectionRef.current!.style.height = h / 16 + "rem"
    }
  }

  function onUp(endY: number, removing?: boolean) {
    const rect = divRef.current!.getBoundingClientRect()
    const y = endY - rect.top

    sectionRef.current!.style.display = "none"

    const selectionStartTime = Math.floor(
      Math.max(
        startTime,
        Math.min(
          startTime + (startY / (30 * 16)) * (endTime - startTime),
          endTime
        )
      )
    )
    const selectionEndTime = Math.floor(
      Math.max(
        startTime,
        Math.min(startTime + (y / (30 * 16)) * (endTime - startTime), endTime)
      )
    )
    onRegister(date, selectionStartTime, selectionEndTime, removing)
    setView(false)
    setRemoving(false)
  }

  function onUpMobileRemoving(startY: number, endY: number) {
    const rect = divRef.current!.getBoundingClientRect()
    const y1 = startY - rect.top
    const y2 = endY - rect.top

    sectionRef.current!.style.display = "none"

    const selectionStartTime = Math.floor(
      Math.max(
        startTime,
        Math.min(startTime + (y1 / (30 * 16)) * (endTime - startTime), endTime)
      )
    )
    const selectionEndTime = Math.floor(
      Math.max(
        startTime,
        Math.min(startTime + (y2 / (30 * 16)) * (endTime - startTime), endTime)
      )
    )
    onRegister(date, selectionStartTime, selectionEndTime, true)
    setView(false)
    setRemoving(false)
  }

  useEffect(() => {
    var altStartY: number | undefined = undefined
    var endY: number | undefined = undefined

    if (!view) {
      return
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!view || !divRef.current) {
        return
      }

      onMove(event.clientY)
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!view || !divRef.current) {
        return
      }

      if (event.touches.length > 1) {
        onMoveRemoving([event.touches[0].clientY, event.touches[1].clientY])
        altStartY = event.touches[0].clientY
        endY = event.touches[1].clientY
      } else {
        onMove(event.touches[0].clientY)
        altStartY = undefined
        endY = event.touches[0].clientY
      }
    }

    const onTouchEnd = (event: TouchEvent) => {
      if (!view || !divRef.current) {
        // Resetting the value here is crucial.
        endY = undefined
        return
      }

      if (altStartY === undefined) {
        if (endY !== undefined) {
          onUp(endY, false)
        }
      } else {
        onUpMobileRemoving(altStartY, endY!)
      }
    }

    const onMouseUp = (event: MouseEvent) => {
      if (!view || !divRef.current) {
        return
      }

      onUp(event.clientY, removing)
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    window.addEventListener("touchmove", onTouchMove)
    window.addEventListener("touchend", onTouchEnd)

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
    }
  }, [view])

  function onDown(clientY: number) {
    const rect = divRef.current!.getBoundingClientRect()
    const y = clientY - rect.top

    setStartY(y)

    sectionRef.current!.style.display = "block"
    sectionRef.current!.style.height = "0"
    setView(true)
  }

  function onMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    if (disabled) {
      return
    }

    event.preventDefault()

    onDown(event.clientY)

    if (event.button == 2) {
      setRemoving(true)
    }
  }

  function onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (disabled) {
      return
    }

    event.preventDefault()

    onDown(event.touches[0].clientY)

    // On mobile, substitue right click for two-finger tap
    if (event.touches.length > 1) {
      setRemoving(true)
    }
  }

  if (theme) {
    style.width = "100%"
    style.height = "30rem"

    style_text.textAlign = "center"
    style_text.font = theme.font
    style_text.fontWeight = "bold"
    style_text.margin = "0"
    style_text.opacity = 0.4

    if (date == 5) {
      style_text.color = "royalblue"
    }

    if (date == 6) {
      style_text.color = "crimson"
    }

    style_bg.backgroundColor = theme.secondaryBackgroundColor + "88"
    style_bg.width = "100%"
    style_bg.height = "100%"
    style_bg.borderRadius = "10px"
    style_bg.backgroundImage =
      "repeating-linear-gradient(#ffffff22 0 0, transparent 1px 100%)"
    style_bg.backgroundSize = "auto " + remPerHour + "rem"
    style_bg.position = "relative"
    style_bg.overflow = "hidden"
    style_bg.touchAction = "none"
  }

  return (
    <div style={style}>
      <p style={style_text}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][date]}
      </p>
      <div
        ref={divRef}
        style={style_bg}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onContextMenu={(event) => {
          event.preventDefault()
        }}
      >
        <When2MeetSection ref={sectionRef} />
        {Array.from(data, ([d, s, e]) => {
          if (d == date) {
            return <When2MeetSection startTime={s} endTime={e} />
          }
        })}
      </div>
    </div>
  )
}

const When2MeetTimeLabel = () => {
  const style: React.CSSProperties = {}

  const { startTime, endTime, theme } = useContext(StateContext)!

  const remPerHour = (30 * 3600) / (endTime - startTime)

  if (theme) {
    style.width = "3rem"
    style.height = "100%"
    style.paddingTop = 1 + (startTime % 3600) / (3600 * remPerHour) + "rem"
  }

  return (
    <div style={style}>
      {Array.from(
        {
          length: Math.floor(endTime / 3600) - Math.ceil(startTime / 3600) + 1,
        },
        (_, i) => {
          const style: React.CSSProperties = {}
          const style_text: React.CSSProperties = {}

          if (theme) {
            style.width = "100%"
            style.height = remPerHour + "rem"
            style.textAlign = "center"

            style_text.font = theme.font
            style_text.fontWeight = "bold"
            style_text.fontSize = "0.75rem"
            style_text.margin = "0"
            style_text.opacity = 0.4
          }

          return (
            <div style={style}>
              <p style={style_text}>{Math.ceil(startTime / 3600) + i}</p>
            </div>
          )
        }
      )}
    </div>
  )
}

/**
 * This is a React-based component template. The `render()` function is called
 * automatically when your component should be re-rendered.
 */
class When2Meet extends StreamlitComponentBase<State> {
  public state: State = {
    startTime: 7 * 3600,
    endTime: 27 * 3600,
    disabled: false,
    data: [],
    theme: this.props.theme,
  }

  private initial = false

  public render = (): ReactNode => {
    const { theme } = this.props
    const style: React.CSSProperties = {}

    if (!this.initial) {
      this.setState({
        data: this.props.args["initial_data"] || [],
      })

      this.initial = true
    }

    this.setState({
      startTime: this.props.args["start_time"] ?? 7 * 3600,
      endTime: this.props.args["end_time"] ?? 27 * 3600,
      disabled: this.props.args["disabled"] ?? true,
    })

    // Maintain compatibility with older versions of Streamlit that don't send
    // a theme object.
    if (theme) {
      style.display = "flex"
      style.flexDirection = "row"
      style.gap = "0.25rem"
    }

    // Show a button and some text.
    // When the button is clicked, we'll increment our "numClicks" state
    // variable, and send its new value back to Streamlit, where it'll
    // be available to the Python program.
    return (
      <StateContext.Provider value={this.state}>
        <div style={style}>
          <When2MeetTimeLabel />
          {Array.from({ length: 7 }, (_, i) => (
            <When2MeetColumn date={i} onRegister={this.onRegister} />
          ))}
        </div>
      </StateContext.Provider>
    )
  }

  private onRegister = (
    date: number,
    startTime: number,
    endTime: number,
    removing?: boolean
  ) => {
    if (this.state.disabled) {
      return
    }

    if (!removing) {
      if (startTime > endTime) {
        const temp = startTime
        startTime = endTime
        endTime = temp
      } else if (startTime == endTime) {
        return
      }

      for (let i = this.state.data.length - 1; i >= 0; i--) {
        const [d, s, e] = this.state.data[i]

        if (d == date) {
          if (startTime <= e && s <= endTime) {
            startTime = Math.min(startTime, s)
            endTime = Math.max(endTime, e)
            this.state.data.splice(i, 1)
          }
        }
      }

      this.setState(
        {
          data: [...this.state.data, [date, startTime, endTime]],
        },
        () => {
          Streamlit.setComponentValue(this.state.data)
        }
      )

      return
    } else {
      if (startTime > endTime) {
        const temp = startTime
        startTime = endTime
        endTime = temp
      } else if (startTime == endTime) {
        return
      }

      for (let i = this.state.data.length - 1; i >= 0; i--) {
        const [d, s, e] = this.state.data[i]

        if (d == date) {
          if (startTime <= s && e <= endTime) {
            this.state.data.splice(i, 1)
          } else if (startTime <= s && s < endTime) {
            this.state.data[i][1] = endTime
          } else if (startTime < e && e <= endTime) {
            this.state.data[i][2] = startTime
          } else if (s < startTime && endTime < e) {
            this.state.data[i][2] = startTime
            this.state.data.push([date, endTime, e])
          }
        }
      }

      this.forceUpdate()
      Streamlit.setComponentValue(this.state.data)
    }
  }
}

// "withStreamlitConnection" is a wrapper function. It bootstraps the
// connection between your component and the Streamlit app, and handles
// passing arguments from Python -> Component.
//
// You don't need to edit withStreamlitConnection (but you're welcome to!).
export default withStreamlitConnection(When2Meet)
